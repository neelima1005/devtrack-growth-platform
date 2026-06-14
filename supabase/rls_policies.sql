-- Supabase RLS Policies for DevTrack AI
-- Run this script in the Supabase SQL Editor to secure all user-owned tables.

-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- =================================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- =================================================================
alter table users enable row level security;
alter table github_profiles enable row level security;
alter table repositories enable row level security;
alter table goals enable row level security;
alter table achievements enable row level security;
alter table ai_chats enable row level security;
alter table chat_messages enable row level security;
alter table repository_reviews enable row level security;
alter table skill_reports enable row level security;
alter table notifications enable row level security;
alter table leaderboard enable row level security;

-- =================================================================
-- 2. DROP EXISTING POLICIES TO PREVENT DUPLICATES
-- =================================================================
-- Users Table
drop policy if exists "Users can select their own profile" on users;
drop policy if exists "Users can insert their own profile" on users;
drop policy if exists "Users can update their own profile" on users;
drop policy if exists "Users can delete their own profile" on users;

-- GitHub Profiles Table
drop policy if exists "Users can select their own github profile" on github_profiles;
drop policy if exists "Users can insert their own github profile" on github_profiles;
drop policy if exists "Users can update their own github profile" on github_profiles;
drop policy if exists "Users can delete their own github profile" on github_profiles;

-- Repositories Table
drop policy if exists "Users can select their own repositories" on repositories;
drop policy if exists "Users can insert their own repositories" on repositories;
drop policy if exists "Users can update their own repositories" on repositories;
drop policy if exists "Users can delete their own repositories" on repositories;

-- Goals Table
drop policy if exists "Users can select their own goals" on goals;
drop policy if exists "Users can insert their own goals" on goals;
drop policy if exists "Users can update their own goals" on goals;
drop policy if exists "Users can delete their own goals" on goals;

-- Achievements Table
drop policy if exists "Users can select their own achievements" on achievements;
drop policy if exists "Users can insert their own achievements" on achievements;
drop policy if exists "Users can update their own achievements" on achievements;
drop policy if exists "Users can delete their own achievements" on achievements;

-- AI Chats Table
drop policy if exists "Users can select their own chats" on ai_chats;
drop policy if exists "Users can insert their own chats" on ai_chats;
drop policy if exists "Users can update their own chats" on ai_chats;
drop policy if exists "Users can delete their own chats" on ai_chats;

-- Chat Messages Table
drop policy if exists "Users can select their own chat messages" on chat_messages;
drop policy if exists "Users can insert their own chat messages" on chat_messages;
drop policy if exists "Users can update their own chat messages" on chat_messages;
drop policy if exists "Users can delete their own chat messages" on chat_messages;

-- Repository Reviews Table
drop policy if exists "Users can select their own repository reviews" on repository_reviews;
drop policy if exists "Users can insert their own repository reviews" on repository_reviews;
drop policy if exists "Users can update their own repository reviews" on repository_reviews;
drop policy if exists "Users can delete their own repository reviews" on repository_reviews;

-- Skill Reports Table
drop policy if exists "Users can select their own skill reports" on skill_reports;
drop policy if exists "Users can insert their own skill reports" on skill_reports;
drop policy if exists "Users can update their own skill reports" on skill_reports;
drop policy if exists "Users can delete their own skill reports" on skill_reports;

-- Notifications Table
drop policy if exists "Users can select their own notifications" on notifications;
drop policy if exists "Users can insert their own notifications" on notifications;
drop policy if exists "Users can update their own notifications" on notifications;
drop policy if exists "Users can delete their own notifications" on notifications;

-- Leaderboard Table
drop policy if exists "Users can select their own leaderboard record" on leaderboard;
drop policy if exists "Users can insert their own leaderboard record" on leaderboard;
drop policy if exists "Users can update their own leaderboard record" on leaderboard;
drop policy if exists "Users can delete their own leaderboard record" on leaderboard;


-- =================================================================
-- 3. CREATE SECURE ROW LEVEL SECURITY POLICIES
-- =================================================================

-- Users Table Policies (auth.uid() maps to 'id')
create policy "Users can select their own profile" on users 
    for select using (auth.uid() = id);
create policy "Users can insert their own profile" on users 
    for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on users 
    for update using (auth.uid() = id);
create policy "Users can delete their own profile" on users 
    for delete using (auth.uid() = id);

-- GitHub Profiles Table Policies (auth.uid() maps to 'id')
create policy "Users can select their own github profile" on github_profiles 
    for select using (auth.uid() = id);
create policy "Users can insert their own github profile" on github_profiles 
    for insert with check (auth.uid() = id);
create policy "Users can update their own github profile" on github_profiles 
    for update using (auth.uid() = id);
create policy "Users can delete their own github profile" on github_profiles 
    for delete using (auth.uid() = id);

-- Repositories Table Policies (auth.uid() maps to 'user_id')
create policy "Users can select their own repositories" on repositories 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own repositories" on repositories 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own repositories" on repositories 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own repositories" on repositories 
    for delete using (auth.uid() = user_id);

-- Goals Table Policies (auth.uid() maps to 'user_id')
create policy "Users can select their own goals" on goals 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own goals" on goals 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own goals" on goals 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own goals" on goals 
    for delete using (auth.uid() = user_id);

-- Achievements Table Policies (auth.uid() maps to 'user_id')
create policy "Users can select their own achievements" on achievements 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own achievements" on achievements 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own achievements" on achievements 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own achievements" on achievements 
    for delete using (auth.uid() = user_id);

-- AI Chats Table Policies (auth.uid() maps to 'user_id')
create policy "Users can select their own chats" on ai_chats 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own chats" on ai_chats 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own chats" on ai_chats 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own chats" on ai_chats 
    for delete using (auth.uid() = user_id);

-- Chat Messages Table Policies (protects messages through chat ownership check)
create policy "Users can select their own chat messages" on chat_messages 
    for select using (exists (
        select 1 from ai_chats where ai_chats.id = chat_messages.chat_id and ai_chats.user_id = auth.uid()
    ));
create policy "Users can insert their own chat messages" on chat_messages 
    for insert with check (exists (
        select 1 from ai_chats where ai_chats.id = chat_messages.chat_id and ai_chats.user_id = auth.uid()
    ));
create policy "Users can update their own chat messages" on chat_messages 
    for update using (exists (
        select 1 from ai_chats where ai_chats.id = chat_messages.chat_id and ai_chats.user_id = auth.uid()
    ));
create policy "Users can delete their own chat messages" on chat_messages 
    for delete using (exists (
        select 1 from ai_chats where ai_chats.id = chat_messages.chat_id and ai_chats.user_id = auth.uid()
    ));

-- Repository Reviews Table Policies (auth.uid() maps to 'user_id')
create policy "Users can select their own repository reviews" on repository_reviews 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own repository reviews" on repository_reviews 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own repository reviews" on repository_reviews 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own repository reviews" on repository_reviews 
    for delete using (auth.uid() = user_id);

-- Skill Reports Table Policies (auth.uid() maps to 'user_id')
create policy "Users can select their own skill reports" on skill_reports 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own skill reports" on skill_reports 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own skill reports" on skill_reports 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own skill reports" on skill_reports 
    for delete using (auth.uid() = user_id);

-- Notifications Table Policies (auth.uid() maps to 'user_id')
create policy "Users can select their own notifications" on notifications 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own notifications" on notifications 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own notifications" on notifications 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own notifications" on notifications 
    for delete using (auth.uid() = user_id);

-- Leaderboard Table Policies (auth.uid() maps to 'user_id')
create policy "Users can select their own leaderboard record" on leaderboard 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own leaderboard record" on leaderboard 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own leaderboard record" on leaderboard 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own leaderboard record" on leaderboard 
    for delete using (auth.uid() = user_id);
