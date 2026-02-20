-- =====================================================
-- CREATE TRADING AUDIT TRIGGERS - FIXED VERSION
-- =====================================================

-- Create audit trigger function for trading operations
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  audit_details jsonb;
  record_uuid uuid;
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
    -- Convert text ID to UUID if needed
    record_uuid := CASE 
      WHEN pg_typeof(NEW.id) = 'text' THEN NEW.id::uuid
      ELSE NEW.id
    END;
    
    INSERT INTO public.audit_logs (
      table_name, 
      record_id, 
      operation, 
      new_data, 
      details,
      changed_at,
      user_id, -- For backward compatibility
      action -- For backward compatibility
    ) VALUES (
      TG_TABLE_NAME, 
      record_uuid, 
      'INSERT', 
      to_jsonb(NEW),
      audit_details,
      now(),
      COALESCE(NEW.user_id, NEW.user_id), -- Handle both user_id and user_id
      'INSERT_' || TG_TABLE_NAME
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Convert text ID to UUID if needed
    record_uuid := CASE 
      WHEN pg_typeof(NEW.id) = 'text' THEN NEW.id::uuid
      ELSE NEW.id
    END;
    
    INSERT INTO public.audit_logs (
      table_name, 
      record_id, 
      operation, 
      old_data, 
      new_data, 
      details,
      changed_at,
      user_id, -- For backward compatibility
      action -- For backward compatibility
    ) VALUES (
      TG_TABLE_NAME, 
      record_uuid, 
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
    -- Convert text ID to UUID if needed
    record_uuid := CASE 
      WHEN pg_typeof(OLD.id) = 'text' THEN OLD.id::uuid
      ELSE OLD.id
    END;
    
    INSERT INTO public.audit_logs (
      table_name, 
      record_id, 
      operation, 
      old_data, 
      details,
      changed_at,
      user_id, -- For backward compatibility
      action -- For backward compatibility
    ) VALUES (
      TG_TABLE_NAME, 
      record_uuid, 
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the main operation
    RAISE NOTICE 'Audit trigger failed for % on table %: %', TG_OP, TG_TABLE_NAME, SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for trading_locks
DROP TRIGGER IF EXISTS audit_trading_locks_trigger ON public.trading_locks;
CREATE TRIGGER audit_trading_locks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.trading_locks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create triggers for trades (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'trades') THEN
        DROP TRIGGER IF EXISTS audit_trades_trigger ON public.trades;
        CREATE TRIGGER audit_trades_trigger
          AFTER INSERT OR UPDATE OR DELETE ON public.trades
          FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    END IF;
END
$$;

-- Create triggers for options_orders (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'options_orders') THEN
        DROP TRIGGER IF EXISTS audit_options_orders_trigger ON public.options_orders;
        CREATE TRIGGER audit_options_orders_trigger
          AFTER INSERT OR UPDATE OR DELETE ON public.options_orders
          FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    END IF;
END
$$;

-- Create triggers for transactions (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'transactions') THEN
        DROP TRIGGER IF EXISTS audit_transactions_trigger ON public.transactions;
        CREATE TRIGGER audit_transactions_trigger
          AFTER INSERT OR UPDATE OR DELETE ON public.transactions
          FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    END IF;
END
$$;

-- =====================================================
-- SUMMARY
-- =====================================================
-- This script creates audit triggers for trading tables:
-- 1. audit_trigger_function - handles INSERT/UPDATE/DELETE operations
-- 2. Triggers for trading_locks table
-- 3. Conditional triggers for trades, options_orders, transactions
-- 4. Uses existing audit_logs table with proper structure
-- 5. Records all changes with JSON details for debugging
