-- Supabase Migration: Enable RLS and Create Policies for all tables
-- Target Tables: users, github_profiles, repositories, goals, achievements, ai_chats, chat_messages, repository_reviews, skill_reports, notifications, leaderboard

-- =================================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- =================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 2. DROP EXISTING POLICIES TO PREVENT DUPLICATES & CONFLICTS
-- =================================================================

-- users
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;
DROP POLICY IF EXISTS "Users can select their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;

-- github_profiles
DROP POLICY IF EXISTS "github_profiles_select" ON github_profiles;
DROP POLICY IF EXISTS "github_profiles_insert" ON github_profiles;
DROP POLICY IF EXISTS "github_profiles_update" ON github_profiles;
DROP POLICY IF EXISTS "github_profiles_delete" ON github_profiles;
DROP POLICY IF EXISTS "Users can select their own github profile" ON github_profiles;
DROP POLICY IF EXISTS "Users can insert their own github profile" ON github_profiles;
DROP POLICY IF EXISTS "Users can update their own github profile" ON github_profiles;
DROP POLICY IF EXISTS "Users can delete their own github profile" ON github_profiles;

-- repositories
DROP POLICY IF EXISTS "repositories_select" ON repositories;
DROP POLICY IF EXISTS "repositories_insert" ON repositories;
DROP POLICY IF EXISTS "repositories_update" ON repositories;
DROP POLICY IF EXISTS "repositories_delete" ON repositories;
DROP POLICY IF EXISTS "Users can select their own repositories" ON repositories;
DROP POLICY IF EXISTS "Users can insert their own repositories" ON repositories;
DROP POLICY IF EXISTS "Users can update their own repositories" ON repositories;
DROP POLICY IF EXISTS "Users can delete their own repositories" ON repositories;

-- goals
DROP POLICY IF EXISTS "goals_select" ON goals;
DROP POLICY IF EXISTS "goals_insert" ON goals;
DROP POLICY IF EXISTS "goals_update" ON goals;
DROP POLICY IF EXISTS "goals_delete" ON goals;
DROP POLICY IF EXISTS "Users can select their own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;

-- achievements
DROP POLICY IF EXISTS "achievements_select" ON achievements;
DROP POLICY IF EXISTS "achievements_insert" ON achievements;
DROP POLICY IF EXISTS "achievements_update" ON achievements;
DROP POLICY IF EXISTS "achievements_delete" ON achievements;
DROP POLICY IF EXISTS "Users can select their own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can delete their own achievements" ON achievements;

-- ai_chats
DROP POLICY IF EXISTS "ai_chats_select" ON ai_chats;
DROP POLICY IF EXISTS "ai_chats_insert" ON ai_chats;
DROP POLICY IF EXISTS "ai_chats_update" ON ai_chats;
DROP POLICY IF EXISTS "ai_chats_delete" ON ai_chats;
DROP POLICY IF EXISTS "Users can select their own chats" ON ai_chats;
DROP POLICY IF EXISTS "Users can insert their own chats" ON ai_chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON ai_chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON ai_chats;

-- chat_messages
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON chat_messages;
DROP POLICY IF EXISTS "Users can select their own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON chat_messages;

-- repository_reviews
DROP POLICY IF EXISTS "repository_reviews_select" ON repository_reviews;
DROP POLICY IF EXISTS "repository_reviews_insert" ON repository_reviews;
DROP POLICY IF EXISTS "repository_reviews_update" ON repository_reviews;
DROP POLICY IF EXISTS "repository_reviews_delete" ON repository_reviews;
DROP POLICY IF EXISTS "Users can select their own repository reviews" ON repository_reviews;
DROP POLICY IF EXISTS "Users can insert their own repository reviews" ON repository_reviews;
DROP POLICY IF EXISTS "Users can update their own repository reviews" ON repository_reviews;
DROP POLICY IF EXISTS "Users can delete their own repository reviews" ON repository_reviews;

-- skill_reports
DROP POLICY IF EXISTS "skill_reports_select" ON skill_reports;
DROP POLICY IF EXISTS "skill_reports_insert" ON skill_reports;
DROP POLICY IF EXISTS "skill_reports_update" ON skill_reports;
DROP POLICY IF EXISTS "skill_reports_delete" ON skill_reports;
DROP POLICY IF EXISTS "Users can select their own skill reports" ON skill_reports;
DROP POLICY IF EXISTS "Users can insert their own skill reports" ON skill_reports;
DROP POLICY IF EXISTS "Users can update their own skill reports" ON skill_reports;
DROP POLICY IF EXISTS "Users can delete their own skill reports" ON skill_reports;

-- notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
DROP POLICY IF EXISTS "Users can select their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- leaderboard
DROP POLICY IF EXISTS "leaderboard_select" ON leaderboard;
DROP POLICY IF EXISTS "leaderboard_insert" ON leaderboard;
DROP POLICY IF EXISTS "leaderboard_update" ON leaderboard;
DROP POLICY IF EXISTS "leaderboard_delete" ON leaderboard;
DROP POLICY IF EXISTS "Users can select their own leaderboard record" ON leaderboard;
DROP POLICY IF EXISTS "Users can insert their own leaderboard record" ON leaderboard;
DROP POLICY IF EXISTS "Users can update their own leaderboard record" ON leaderboard;
DROP POLICY IF EXISTS "Users can delete their own leaderboard record" ON leaderboard;


-- =================================================================
-- 3. CREATE OWNER-SCOPED POLICIES
-- =================================================================

-- --- users (auth.uid() = id) ---
CREATE POLICY "users_select" ON users
    FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_insert" ON users
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_delete" ON users
    FOR DELETE TO authenticated USING (auth.uid() = id);

-- --- github_profiles (auth.uid() = id) ---
CREATE POLICY "github_profiles_select" ON github_profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "github_profiles_insert" ON github_profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "github_profiles_update" ON github_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "github_profiles_delete" ON github_profiles
    FOR DELETE TO authenticated USING (auth.uid() = id);

-- --- repositories (auth.uid() = user_id) ---
CREATE POLICY "repositories_select" ON repositories
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "repositories_insert" ON repositories
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "repositories_update" ON repositories
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "repositories_delete" ON repositories
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --- goals (auth.uid() = user_id) ---
CREATE POLICY "goals_select" ON goals
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "goals_insert" ON goals
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update" ON goals
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_delete" ON goals
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --- achievements (auth.uid() = user_id) ---
CREATE POLICY "achievements_select" ON achievements
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "achievements_insert" ON achievements
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "achievements_update" ON achievements
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "achievements_delete" ON achievements
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --- ai_chats (auth.uid() = user_id) ---
CREATE POLICY "ai_chats_select" ON ai_chats
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_chats_insert" ON ai_chats
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_chats_update" ON ai_chats
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_chats_delete" ON ai_chats
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --- chat_messages (secured via chat_messages.chat_id -> ai_chats.id -> ai_chats.user_id = auth.uid()) ---
CREATE POLICY "chat_messages_select" ON chat_messages
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM ai_chats 
            WHERE ai_chats.id = chat_messages.chat_id 
              AND ai_chats.user_id = auth.uid()
        )
    );
CREATE POLICY "chat_messages_insert" ON chat_messages
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_chats 
            WHERE ai_chats.id = chat_messages.chat_id 
              AND ai_chats.user_id = auth.uid()
        )
    );
CREATE POLICY "chat_messages_update" ON chat_messages
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM ai_chats 
            WHERE ai_chats.id = chat_messages.chat_id 
              AND ai_chats.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_chats 
            WHERE ai_chats.id = chat_messages.chat_id 
              AND ai_chats.user_id = auth.uid()
        )
    );
CREATE POLICY "chat_messages_delete" ON chat_messages
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM ai_chats 
            WHERE ai_chats.id = chat_messages.chat_id 
              AND ai_chats.user_id = auth.uid()
        )
    );

-- --- repository_reviews (auth.uid() = user_id) ---
CREATE POLICY "repository_reviews_select" ON repository_reviews
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "repository_reviews_insert" ON repository_reviews
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "repository_reviews_update" ON repository_reviews
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "repository_reviews_delete" ON repository_reviews
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --- skill_reports (auth.uid() = user_id) ---
CREATE POLICY "skill_reports_select" ON skill_reports
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "skill_reports_insert" ON skill_reports
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skill_reports_update" ON skill_reports
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skill_reports_delete" ON skill_reports
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --- notifications (auth.uid() = user_id) ---
CREATE POLICY "notifications_select" ON notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON notifications
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --- leaderboard (auth.uid() = user_id) ---
CREATE POLICY "leaderboard_select" ON leaderboard
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "leaderboard_insert" ON leaderboard
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leaderboard_update" ON leaderboard
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leaderboard_delete" ON leaderboard
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
