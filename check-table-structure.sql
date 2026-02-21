-- Check the actual structure of options_orders table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'options_orders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there are any recent orders to see the actual data
SELECT * FROM public.options_orders 
ORDER BY created_at DESC 
LIMIT 1;
