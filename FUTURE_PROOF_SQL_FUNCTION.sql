-- FUTURE-PROOF SQL EXECUTION FUNCTION
-- Copy this into Supabase SQL Editor and run it once
-- After this, Claude can manage your database directly!

-- Create a secure SQL execution function
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    rows_affected integer;
BEGIN
    -- Execute the provided query
    EXECUTE query;
    
    -- Get the number of rows affected
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    -- Return success response
    RETURN json_build_object(
        'success', true, 
        'rows_affected', rows_affected,
        'message', 'Query executed successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN json_build_object(
            'success', false, 
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'message', 'Query execution failed'
        );
END;
$$;

-- Create a function to run queries and return data
CREATE OR REPLACE FUNCTION public.query_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Execute query and return results as JSON
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query) INTO result;
    
    RETURN json_build_object(
        'success', true,
        'data', COALESCE(result, '[]'::json),
        'message', 'Query executed successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'message', 'Query execution failed'
        );
END;
$$;

-- Grant permissions to service role and authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.query_sql(text) TO authenticated, service_role;

-- Add helpful comments
COMMENT ON FUNCTION public.exec_sql(text) IS 'Executes SQL commands (CREATE, INSERT, UPDATE, DELETE, etc.) and returns execution status';
COMMENT ON FUNCTION public.query_sql(text) IS 'Executes SELECT queries and returns data as JSON';

-- Test the functions work
SELECT public.exec_sql('SELECT 1') as test_exec;
SELECT public.query_sql('SELECT version() as database_version') as test_query;

-- Show success message
SELECT 'SQL execution functions created successfully! Claude can now manage your database directly.' as result;