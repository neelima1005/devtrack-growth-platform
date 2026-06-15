-- Supabase Migration: Create all tables and indexes defined in schema.sql
-- Target Schema: public

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Profile Table (extends Supabase Auth users)
create table users (
    id uuid primary key references auth.users on delete cascade,
    name text not null,
    email text not null unique,
    profile_picture text,
    github_username text,
    career_goal text,
    experience_level text,
    preferred_tech_stack text[] default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. GitHub Profiles Table
create table github_profiles (
    id uuid primary key references users(id) on delete cascade,
    total_repositories integer default 0 not null,
    total_contributions integer default 0 not null,
    current_streak integer default 0 not null,
    longest_streak integer default 0 not null,
    languages_used jsonb default '{}'::jsonb not null, -- format: {"JavaScript": 45, "React": 30, "Python": 25}
    contribution_activity jsonb default '{}'::jsonb not null, -- format: {"2026-06-01": 5, "2026-06-02": 8}
    activity_timeline jsonb default '[]'::jsonb not null, -- format: [{"type": "commit", "repo": "x", "date": "..."}]
    last_synced_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Repositories Table
create table repositories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade not null,
    name text not null,
    description text,
    html_url text not null,
    language text,
    stars_count integer default 0 not null,
    forks_count integer default 0 not null,
    commits_count integer default 0 not null,
    health_score integer default null,
    ai_review_status text default 'pending'::text not null, -- pending, processing, completed, failed
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Learning Goal Tracker Table
create table goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade not null,
    title text not null,
    description text,
    category text default 'coding'::text not null, -- coding, learning, career, open_source
    target_date timestamp with time zone,
    completion_percentage float default 0.0 not null,
    milestones jsonb default '[]'::jsonb not null, -- format: [{"title": "Learn hooks", "completed": true}]
    status text default 'not_started'::text not null, -- not_started, in_progress, completed
    reminders_enabled boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Achievements / Badges Table
create table achievements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade not null,
    badge_type text not null, -- first_commit, streak_7, streak_30, open_source, ai_explorer, goal_crusher
    name text not null,
    description text not null,
    icon text not null,
    unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, badge_type)
);

-- 6. AI Chats Table
create table ai_chats (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade not null,
    title text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Chat Messages Table (Stores chatbot details)
create table chat_messages (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid references ai_chats(id) on delete cascade not null,
    sender text not null, -- user, assistant
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. AI Repository Reviews Table
create table repository_reviews (
    id uuid primary key default gen_random_uuid(),
    repository_id uuid references repositories(id) on delete cascade not null,
    user_id uuid references users(id) on delete cascade not null,
    health_score integer not null,
    strengths text[] default '{}'::text[] not null,
    weaknesses text[] default '{}'::text[] not null,
    recommendations text[] default '{}'::text[] not null,
    readme_improvements text[] default '{}'::text[] not null,
    feature_suggestions text[] default '{}'::text[] not null,
    security_suggestions text[] default '{}'::text[] not null,
    refactoring_suggestions text[] default '{}'::text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Skill Gap Reports Table
create table skill_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade not null,
    current_skills text[] default '{}'::text[] not null,
    missing_skills text[] default '{}'::text[] not null,
    personalized_roadmap jsonb default '[]'::jsonb not null, -- format: [{"step": 1, "title": "...", "resources": []}]
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Real-time Notifications Table
create table notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade not null,
    type text not null, -- goal, achievement, streak, ai_insight
    title text not null,
    message text not null,
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Community Leaderboard Table
create table leaderboard (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade not null,
    name text not null,
    github_username text,
    coding_streak integer default 0 not null,
    growth_score integer default 0 not null,
    contributions integer default 0 not null,
    goals_completed integer default 0 not null,
    ranking_type text default 'global'::text not null, -- global, weekly, monthly
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, ranking_type)
);

-- Indices for performance optimization
create index idx_repositories_user_id on repositories(user_id);
create index idx_goals_user_id on goals(user_id);
create index idx_notifications_user_id_unread on notifications(user_id) where is_read = false;
create index idx_chat_messages_chat_id on chat_messages(chat_id);
create index idx_leaderboard_growth_score on leaderboard(growth_score desc);
create index idx_leaderboard_coding_streak on leaderboard(coding_streak desc);
