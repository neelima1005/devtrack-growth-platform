import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase Client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local Mock Database Helper
export const mockDb = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const data = localStorage.getItem(`devtrack_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(`devtrack_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving mock data', e);
    }
  },
  clear: (): void => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('devtrack_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// --- Real Supabase Integration Layer ---

export const db = {
  // Auth Functions
  signUp: async (email: string, password: string, name: string, githubUsername: string) => {
    if (!supabase) {
      // Offline fallback signup
      const mockUser = {
        id: 'mock-user-' + Date.now(),
        name,
        email,
        github_username: githubUsername,
        preferred_tech_stack: ['React', 'TypeScript'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockDb.set('session', mockUser);
      return { data: { user: mockUser }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { data: null, error };
    
    if (data.user) {
      // Insert user profile into database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name,
          email,
          github_username: githubUsername,
          preferred_tech_stack: []
        });
      if (profileError) {
        console.error('Error creating profile:', profileError);
      } else {
        // Create an empty github profile record for this user to avoid subsequent 406/404 single() errors
        const { error: ghProfileError } = await supabase
          .from('github_profiles')
          .insert({ id: data.user.id, user_id: data.user.id });
        if (ghProfileError) console.error('Error creating github profile:', ghProfileError);
      }
    }
    return { data, error: null };
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      // Offline fallback login
      const existingUser = mockDb.get<any>('session', null);
      if (existingUser && existingUser.email === email) {
        return { data: { user: existingUser }, error: null };
      }
      // Create user profile automatically with dynamic values from email (no mock profile)
      const namePart = email.split('@')[0];
      const displayName = namePart
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const mockUser = {
        id: 'mock-user-123',
        name: displayName || 'Developer User',
        email,
        github_username: '', // Must start empty to prevent rendering mock sync data
        profile_picture: '',
        career_goal: '',
        experience_level: 'Junior / Mid-Level',
        preferred_tech_stack: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockDb.set('session', mockUser);
      return { data: { user: mockUser }, error: null };
    }

    return await supabase.auth.signInWithPassword({ email, password });
  },

  signInWithGitHub: async () => {
    if (!supabase) {
      // Offline fallback login for GitHub (with empty credentials to prompt proper sync setup)
      const mockUser = {
        id: 'mock-github-user',
        name: 'GitHub Developer',
        email: 'github.dev@devtrack.ai',
        github_username: '', // Start empty to prevent syncing fake account data
        profile_picture: '',
        career_goal: '',
        experience_level: 'Junior / Mid-Level',
        preferred_tech_stack: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockDb.set('session', mockUser);
      return { data: { user: mockUser }, error: null };
    }
    return await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
  },

  signOut: async () => {
    if (!supabase) {
      mockDb.clear();
      return { error: null };
    }
    return await supabase.auth.signOut();
  },

  // User Profile
  getProfile: async (userId: string) => {
    if (!supabase) return { data: mockDb.get('profile', null), error: null };
    return await supabase.from('users').select('*').eq('id', userId).single();
  },

  updateProfile: async (userId: string, updates: any) => {
    if (!supabase) {
      const current = mockDb.get('profile', {});
      const updated = { ...current, ...updates };
      mockDb.set('profile', updated);
      return { data: updated, error: null };
    }
    return await supabase.from('users').update(updates).eq('id', userId);
  },

  // GitHub integration tables
  getGitHubProfile: async (userId: string) => {
    if (!supabase) return { data: mockDb.get('gh_profile', null), error: null };
    return await supabase.from('github_profiles').select('*').eq('id', userId).maybeSingle();
  },

  upsertGitHubProfile: async (userId: string, profile: any) => {
    if (!supabase) {
      mockDb.set('gh_profile', profile);
      return { error: null };
    }
    return await supabase.from('github_profiles').upsert({ id: userId, user_id: userId, ...profile });
  },

  // Repositories sync
  getRepositories: async (userId: string) => {
    if (!supabase) return { data: mockDb.get('repos', []), error: null };
    return await supabase.from('repositories').select('*').eq('user_id', userId);
  },

  upsertRepositories: async (repos: any[]) => {
    if (!supabase) {
      mockDb.set('repos', repos);
      return { error: null };
    }
    return await supabase.from('repositories').upsert(repos);
  },

  // Learning Goal Tracker
  getGoals: async (userId: string) => {
    if (!supabase) return { data: mockDb.get('goals_list', []), error: null };
    return await supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  },

  addGoal: async (goal: any) => {
    if (!supabase) {
      const current = mockDb.get<any[]>('goals_list', []);
      const updated = [goal, ...current];
      mockDb.set('goals_list', updated);
      return { data: goal, error: null };
    }
    return await supabase.from('goals').insert(goal);
  },

  deleteGoal: async (goalId: string) => {
    if (!supabase) {
      const current = mockDb.get<any[]>('goals_list', []);
      const updated = current.filter(g => g.id !== goalId);
      mockDb.set('goals_list', updated);
      return { error: null };
    }
    return await supabase.from('goals').delete().eq('id', goalId);
  },

  updateGoal: async (goalId: string, updates: any) => {
    if (!supabase) {
      const current = mockDb.get<any[]>('goals_list', []);
      const updated = current.map(g => g.id === goalId ? { ...g, ...updates } : g);
      mockDb.set('goals_list', updated);
      return { error: null };
    }
    return await supabase.from('goals').update(updates).eq('id', goalId);
  },

  // Achievements
  getAchievements: async (userId: string) => {
    if (!supabase) return { data: mockDb.get('achievements', []), error: null };
    return await supabase.from('achievements').select('*').eq('user_id', userId);
  },

  unlockAchievement: async (achievement: any) => {
    if (!supabase) {
      const current = mockDb.get<any[]>('achievements', []);
      if (current.some(a => a.badge_type === achievement.badge_type)) return { error: null };
      const updated = [...current, achievement];
      mockDb.set('achievements', updated);
      return { error: null };
    }
    return await supabase.from('achievements').upsert(achievement, { onConflict: 'user_id,badge_type' });
  },

  // AI Chats & Chat messages
  getChats: async (userId: string) => {
    if (!supabase) return { data: mockDb.get('chats', []), error: null };
    return await supabase.from('ai_chats').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  },

  createChat: async (chat: any) => {
    if (!supabase) {
      const current = mockDb.get<any[]>('chats', []);
      const updated = [chat, ...current];
      mockDb.set('chats', updated);
      return { data: chat, error: null };
    }
    return await supabase.from('ai_chats').insert(chat);
  },

  getChatMessages: async (chatId: string) => {
    if (!supabase) return { data: mockDb.get(`chat_messages_${chatId}`, []), error: null };
    return await supabase.from('chat_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
  },

  addChatMessage: async (message: any) => {
    if (!supabase) {
      const current = mockDb.get<any[]>(`chat_messages_${message.chat_id}`, []);
      const updated = [...current, message];
      mockDb.set(`chat_messages_${message.chat_id}`, updated);
      return { data: message, error: null };
    }
    return await supabase.from('chat_messages').insert(message);
  },

  // Repo Review Report
  getRepositoryReview: async (repoId: string) => {
    if (!supabase) return { data: mockDb.get(`repo_review_${repoId}`, null), error: null };
    return await supabase.from('repository_reviews').select('*').eq('repository_id', repoId).maybeSingle();
  },

  saveRepositoryReview: async (review: any) => {
    if (!supabase) {
      mockDb.set(`repo_review_${review.repository_id}`, review);
      return { error: null };
    }
    return await supabase.from('repository_reviews').insert(review);
  },

  // Skill Gap Analyzer Reports
  getSkillReport: async (userId: string) => {
    if (!supabase) return { data: mockDb.get('skill_report', null), error: null };
    return await supabase.from('skill_reports').select('*').eq('user_id', userId).maybeSingle();
  },

  saveSkillReport: async (report: any) => {
    if (!supabase) {
      mockDb.set('skill_report', report);
      return { error: null };
    }
    return await supabase.from('skill_reports').upsert(report);
  },

  // Real-time Notifications
  getNotifications: async (userId: string) => {
    if (!supabase) return { data: mockDb.get('notifications', []), error: null };
    return await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  },

  addNotification: async (notification: any) => {
    if (!supabase) {
      const current = mockDb.get<any[]>('notifications', []);
      const updated = [notification, ...current];
      mockDb.set('notifications', updated);
      return { error: null };
    }
    return await supabase.from('notifications').insert(notification);
  },

  markNotificationsAsRead: async (userId: string) => {
    if (!supabase) {
      const current = mockDb.get<any[]>('notifications', []);
      const updated = current.map(n => ({ ...n, is_read: true }));
      mockDb.set('notifications', updated);
      return { error: null };
    }
    return await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  },

  // Leaderboard
  getLeaderboard: async () => {
    if (!supabase) {
      return {
        data: [],
        error: null
      };
    }
    return await supabase.from('leaderboard').select('*').order('growth_score', { ascending: false });
  }
};
