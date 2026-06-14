// DevTrack AI Type Definitions

export interface User {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  github_username?: string;
  career_goal?: string;
  experience_level?: string;
  preferred_tech_stack: string[];
  created_at: string;
  updated_at: string;
}

export interface GitHubProfile {
  id: string;
  total_repositories: number;
  total_contributions: number;
  current_streak: number;
  longest_streak: number;
  languages_used: { [key: string]: number };
  contribution_activity: { [date: string]: number };
  activity_timeline: Array<{
    type: 'commit' | 'pr' | 'star' | 'fork' | 'merge';
    repo: string;
    message?: string;
    date: string;
  }>;
  last_synced_at: string;
}

export interface Repository {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  html_url: string;
  language?: string;
  stars_count: number;
  forks_count: number;
  commits_count: number;
  health_score?: number;
  ai_review_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface LearningGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: 'coding' | 'learning' | 'career' | 'open_source';
  target_date?: string;
  completion_percentage: number;
  milestones: Milestone[];
  status: 'not_started' | 'in_progress' | 'completed';
  reminders_enabled: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_type: 'first_commit' | 'streak_7' | 'streak_30' | 'open_source' | 'ai_explorer' | 'goal_crusher';
  name: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface AIChat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export interface RepositoryReview {
  id: string;
  repository_id: string;
  user_id: string;
  health_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  readme_improvements: string[];
  feature_suggestions: string[];
  security_suggestions: string[];
  refactoring_suggestions: string[];
  created_at: string;
}

export interface SkillStep {
  step: number;
  title: string;
  description: string;
  resources: string[];
}

export interface SkillReport {
  id: string;
  user_id: string;
  current_skills: string[];
  missing_skills: string[];
  personalized_roadmap: SkillStep[];
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'goal' | 'achievement' | 'streak' | 'ai_insight';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  name: string;
  github_username?: string;
  coding_streak: number;
  growth_score: number;
  contributions: number;
  goals_completed: number;
  ranking_type: 'global' | 'weekly' | 'monthly';
  updated_at: string;
}
