-- Row Level Security (RLS) Policies for QApp
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- Reference: AUTHENTICATION_ANALYSIS.md lines 709-737

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Allow everyone to view user profiles (public information)
CREATE POLICY "Profiles are viewable by everyone" 
ON users
FOR SELECT 
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON users
FOR UPDATE 
USING (auth.uid()::text = id);

-- ============================================================================
-- QUESTIONS TABLE POLICIES
-- ============================================================================

-- Allow everyone to read questions (anonymous browsing)
CREATE POLICY "Questions are viewable by everyone" 
ON questions
FOR SELECT 
USING (true);

-- Only authenticated users can insert questions
-- And only if they set themselves as the author
CREATE POLICY "Authenticated users can insert questions" 
ON questions
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid()::text = author_id
);

-- Users can only update their own questions
CREATE POLICY "Users can update own questions" 
ON questions
FOR UPDATE 
USING (auth.uid()::text = author_id);

-- Users can only delete their own questions
CREATE POLICY "Users can delete own questions" 
ON questions
FOR DELETE 
USING (auth.uid()::text = author_id);

-- ============================================================================
-- REPORTS TABLE POLICIES
-- ============================================================================

-- Authenticated users can report content
-- And only if they set themselves as the reporter
CREATE POLICY "Authenticated users can report" 
ON reports
FOR INSERT 
WITH CHECK (auth.uid()::text = reporter_id);

-- Reports are not publicly viewable (admin only via service role key)
-- This policy effectively blocks all SELECT queries from regular users
CREATE POLICY "Reports are only viewable by admins" 
ON reports
FOR SELECT 
USING (false);

-- NOTE: Admins use the service role key which bypasses RLS policies entirely

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that all policies are created:
-- SELECT tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('users', 'questions', 'reports')
-- ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. auth.uid() returns the UUID of the currently authenticated user
--    - Returns NULL if not authenticated (anonymous)
--    - Matches users.id for authenticated users

-- 2. Service role key bypasses ALL RLS policies
--    - Used for: Migrations, admin operations, server-side API routes
--    - Never expose service role key to frontend

-- 3. Anonymous users can:
--    - Read all questions (feed, search, detail)
--    - Read all user profiles
--    - Cannot: Upload, edit, delete, report

-- 4. Authenticated users can:
--    - Everything anonymous users can do
--    - Upload questions (with themselves as author)
--    - Edit/delete their own questions
--    - Report inappropriate content
--    - Update their own profile

-- 5. Future enhancements (V2):
--    - Admin role column in users table
--    - Admin-specific policies for moderation
--    - Rate limiting policies

