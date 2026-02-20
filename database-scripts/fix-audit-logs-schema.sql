-- Fix audit_logs table schema to match trigger requirements
DROP TABLE IF EXISTS public.audit_logs CASCADE;

CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  -- Additional columns for compatibility
  details jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id), -- For backward compatibility
  action text, -- For backward compatibility
  ip_address INET, -- For backward compatibility
  user_agent text -- For backward compatibility
);

-- Create indexes
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_changed_at ON public.audit_logs(changed_at DESC);
CREATE INDEX idx_audit_logs_changed_by ON public.audit_logs(changed_by);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit logs (admin only)
DROP POLICY IF EXISTS "Admins can manage audit logs" ON public.audit_logs;
CREATE POLICY "Admins can manage audit logs" ON public.audit_logs
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.audit_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO anon;

-- Create or replace the audit trigger function with proper column mapping
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  audit_details jsonb;
BEGIN
  -- Build details based on operation
  audit_details = jsonb_build_object(
    'trigger_name', TG_NAME,
    'trigger_time', TG_WHEN,
    'trigger_level', TG_LEVEL,
    'trigger_operation', TG_OP,
    'table_schema', TG_TABLE_SCHEMA,
    'table_name', TG_TABLE_NAME
  );

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      table_name, 
      record_id, 
      operation, 
      new_data, 
      details,
      changed_at,
      user_id, -- Map from NEW.user_id for backward compatibility
      action -- Map operation to action for backward compatibility
    ) VALUES (
      TG_TABLE_NAME, 
      NEW.id, 
      'INSERT', 
      to_jsonb(NEW),
      audit_details,
      now(),
      COALESCE(NEW.user_id, NEW.user_id), -- Handle both user_id and user_id
      'INSERT_' || TG_TABLE_NAME
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      table_name, 
      record_id, 
      operation, 
      old_data, 
      new_data, 
      details,
      changed_at,
      user_id, -- Map from NEW.user_id for backward compatibility
      action -- Map operation to action for backward compatibility
    ) VALUES (
      TG_TABLE_NAME, 
      NEW.id, 
      'UPDATE', 
      to_jsonb(OLD), 
      to_jsonb(NEW),
      audit_details,
      now(),
      COALESCE(NEW.user_id, OLD.user_id), -- Handle both user_id and user_id
      'UPDATE_' || TG_TABLE_NAME
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      table_name, 
      record_id, 
      operation, 
      old_data, 
      details,
      changed_at,
      user_id, -- Map from OLD.user_id for backward compatibility
      action -- Map operation to action for backward compatibility
    ) VALUES (
      TG_TABLE_NAME, 
      OLD.id, 
      'DELETE', 
      to_jsonb(OLD),
      audit_details,
      now(),
      OLD.user_id,
      'DELETE_' || TG_TABLE_NAME
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers for all relevant tables
DROP TRIGGER IF EXISTS audit_trading_locks_trigger ON public.trading_locks;
CREATE TRIGGER audit_trading_locks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.trading_locks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_trades_trigger ON public.trades;
CREATE TRIGGER audit_trades_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Also add triggers for wallet tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_balances') THEN
    DROP TRIGGER IF EXISTS audit_wallet_balances_trigger ON public.wallet_balances;
    CREATE TRIGGER audit_wallet_balances_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.wallet_balances
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
    DROP TRIGGER IF EXISTS audit_wallet_transactions_trigger ON public.wallet_transactions;
    CREATE TRIGGER audit_wallet_transactions_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.wallet_transactions
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'options_orders') THEN
    DROP TRIGGER IF EXISTS audit_options_orders_trigger ON public.options_orders;
    CREATE TRIGGER audit_options_orders_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.options_orders
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
END $$;
