-- Grant permissions for user_preferences table to anon and authenticated roles
-- This fixes the 500 error when accessing /api/user/preferences

-- Grant SELECT permission to anon role (for unauthenticated users)
GRANT SELECT ON user_preferences TO anon;

-- Grant full permissions to authenticated role (for logged-in users)
GRANT ALL PRIVILEGES ON user_preferences TO authenticated;

-- Ensure RLS policies are properly set
-- Check if policies exist and create them if needed
DO $$
BEGIN
    -- Policy for authenticated users to manage their own preferences
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_preferences' 
        AND policyname = 'Users can manage their own preferences'
    ) THEN
        CREATE POLICY "Users can manage their own preferences" 
        ON user_preferences 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
    
    -- Policy for anon users to read default preferences (if needed)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_preferences' 
        AND policyname = 'Allow anon read access'
    ) THEN
        CREATE POLICY "Allow anon read access" 
        ON user_preferences 
        FOR SELECT 
        USING (true);
    END IF;
END
$$;

-- Verify the grants were applied
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;