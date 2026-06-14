-- Supabase Migration: Enable RLS and Create Policies
-- Target Tables: github_profiles, repositories, notifications, repository_reviews, achievements

-- ==========================================
-- 1. ADD Columns and Foreign Keys to auth.users(id)
-- ==========================================

-- github_profiles
alter table github_profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;
update github_profiles set user_id = id where user_id is null;

-- repositories
alter table repositories drop constraint if exists repositories_user_id_fkey;
alter table repositories add constraint repositories_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- notifications
alter table notifications drop constraint if exists notifications_user_id_fkey;
alter table notifications add constraint notifications_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- repository_reviews
alter table repository_reviews drop constraint if exists repository_reviews_user_id_fkey;
alter table repository_reviews add constraint repository_reviews_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- achievements
alter table achievements drop constraint if exists achievements_user_id_fkey;
alter table achievements add constraint achievements_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- ==========================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ==========================================
alter table github_profiles enable row level security;
alter table repositories enable row level security;
alter table notifications enable row level security;
alter table repository_reviews enable row level security;
alter table achievements enable row level security;

-- ==========================================
-- 3. DROP EXISTING POLICIES TO PREVENT CONFLICTS
-- ==========================================
drop policy if exists "Users can select their own github profile" on github_profiles;
drop policy if exists "Users can insert their own github profile" on github_profiles;
drop policy if exists "Users can update their own github profile" on github_profiles;
drop policy if exists "Users can delete their own github profile" on github_profiles;

drop policy if exists "Users can select their own repositories" on repositories;
drop policy if exists "Users can insert their own repositories" on repositories;
drop policy if exists "Users can update their own repositories" on repositories;
drop policy if exists "Users can delete their own repositories" on repositories;

drop policy if exists "Users can select their own notifications" on notifications;
drop policy if exists "Users can insert their own notifications" on notifications;
drop policy if exists "Users can update their own notifications" on notifications;
drop policy if exists "Users can delete their own notifications" on notifications;

drop policy if exists "Users can select their own repository reviews" on repository_reviews;
drop policy if exists "Users can insert their own repository reviews" on repository_reviews;
drop policy if exists "Users can update their own repository reviews" on repository_reviews;
drop policy if exists "Users can delete their own repository reviews" on repository_reviews;

drop policy if exists "Users can select their own achievements" on achievements;
drop policy if exists "Users can insert their own achievements" on achievements;
drop policy if exists "Users can update their own achievements" on achievements;
drop policy if exists "Users can delete their own achievements" on achievements;

-- ==========================================
-- 4. CREATE OWNER-SCOPED POLICIES (auth.uid() = user_id)
-- ==========================================

-- GitHub Profiles
create policy "Users can select their own github profile" on github_profiles 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own github profile" on github_profiles 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own github profile" on github_profiles 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own github profile" on github_profiles 
    for delete using (auth.uid() = user_id);

-- Repositories
create policy "Users can select their own repositories" on repositories 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own repositories" on repositories 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own repositories" on repositories 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own repositories" on repositories 
    for delete using (auth.uid() = user_id);

-- Notifications
create policy "Users can select their own notifications" on notifications 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own notifications" on notifications 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own notifications" on notifications 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own notifications" on notifications 
    for delete using (auth.uid() = user_id);

-- Repository Reviews
create policy "Users can select their own repository reviews" on repository_reviews 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own repository reviews" on repository_reviews 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own repository reviews" on repository_reviews 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own repository reviews" on repository_reviews 
    for delete using (auth.uid() = user_id);

-- Achievements
create policy "Users can select their own achievements" on achievements 
    for select using (auth.uid() = user_id);
create policy "Users can insert their own achievements" on achievements 
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own achievements" on achievements 
    for update using (auth.uid() = user_id);
create policy "Users can delete their own achievements" on achievements 
    for delete using (auth.uid() = user_id);
