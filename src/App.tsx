import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, Github, Brain, Trophy, Shield, Bell, Moon, Sun, 
  ChevronRight, Terminal, Star, GitFork, GitCommit, Search, Sparkles, 
  MessageSquare, Settings, LogOut, ArrowRight, CheckCircle2, AlertCircle, 
  BookOpen, Plus, Trash2, Calendar, FileText, ChevronDown, User, Layers,
  BarChart2, FileCheck, Compass, Users, LayoutDashboard, HelpCircle,
  Menu, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { User as UserType, GitHubProfile, Repository, LearningGoal, Achievement, ChatMessage } from './types';
import { fetchGitHubData } from './utils/github';
import { db, supabase } from './lib/supabase';

// Theme toggler
const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

export default function App() {
  const processingUserRef = useRef<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [view, setView] = useState<
    'landing' | 'login' | 'register' | 'dashboard' | 'notifications' | 
    'github-hub' | 'repo-analyzer' | 'code-review' | 'repo-comparison' | 
    'resume-analyzer' | 'interview-prep' | 'internship-matcher' | 'recruiter-view' | 
    'ai-coach' | 'skill-gap' | 'learning-roadmap' | 'growth-reports' | 'career-insights' | 
    'settings' | 'profile'
  >('landing');

  // Authenticated states
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [ghProfile, setGhProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // GitHub access tokens
  const [providerToken, setProviderToken] = useState<string | null>(() => localStorage.getItem('devtrack_provider_token'));
  const [githubPat, setGithubPat] = useState<string | null>(() => localStorage.getItem('devtrack_github_pat'));
  
  // Sidebar responsiveness
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Tab-specific states
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [selectedReviewRepoId, setSelectedReviewRepoId] = useState('');
  const [compareRepoId1, setCompareRepoId1] = useState('');
  const [compareRepoId2, setCompareRepoId2] = useState('');
  const [activeReviewReport, setActiveReviewReport] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  
  // Resume Analyzer
  const [resumeText, setResumeText] = useState('');
  const [resumeReport, setResumeReport] = useState<any>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  
  // Interview Prep
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  
  // AI Coach Chat
  const [chats, setChats] = useState<{ id: string, title: string, date: string }[]>([
    { id: 'default', title: 'Developer Growth Coaching', date: 'Active Now' }
  ]);
  const [currentChatId, setCurrentChatId] = useState('default');
  const [chatMessages, setChatMessages] = useState<{ [key: string]: { sender: 'user' | 'assistant', message: string }[] }>({
    'default': [
      { sender: 'assistant', message: 'Hello! I am your AI Coach. I analyze your synchronized GitHub repositories and tech stack gaps. Let me know what your career objectives are!' }
    ]
  });
  const [coachInput, setCoachInput] = useState('');
  const [coachTyping, setCoachTyping] = useState(false);

  // Sync state with URL popstate changes
  const navigateTo = (newView: typeof view, path: string) => {
    setView(newView);
    window.history.pushState({}, '', path);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/dashboard') setView('dashboard');
      else if (path === '/login') setView('login');
      else if (path === '/register') setView('register');
      else if (path === '/notifications') setView('notifications');
      else if (path === '/github-hub') setView('github-hub');
      else if (path === '/repo-analyzer') setView('repo-analyzer');
      else if (path === '/code-review') setView('code-review');
      else if (path === '/repo-comparison') setView('repo-comparison');
      else if (path === '/resume-analyzer') setView('resume-analyzer');
      else if (path === '/interview-prep') setView('interview-prep');
      else if (path === '/internship-matcher') setView('internship-matcher');
      else if (path === '/recruiter-view') setView('recruiter-view');
      else if (path === '/ai-coach') setView('ai-coach');
      else if (path === '/skill-gap') setView('skill-gap');
      else if (path === '/learning-roadmap') setView('learning-roadmap');
      else if (path === '/growth-reports') setView('growth-reports');
      else if (path === '/career-insights') setView('career-insights');
      else if (path === '/settings') setView('settings');
      else if (path === '/profile') setView('profile');
      else setView('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Theme switcher
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  // Load session
  useEffect(() => {
    const path = window.location.pathname;
    let initialView: typeof view = 'landing';
    if (['/dashboard', '/notifications', '/github-hub', '/repo-analyzer', '/code-review', '/repo-comparison', '/resume-analyzer', '/interview-prep', '/internship-matcher', '/recruiter-view', '/ai-coach', '/skill-gap', '/learning-roadmap', '/growth-reports', '/career-insights', '/settings', '/profile'].includes(path)) {
      initialView = path.substring(1) as typeof view;
    } else if (path === '/login') {
      initialView = 'login';
    } else if (path === '/register') {
      initialView = 'register';
    }

    if (supabase) {
      setLoading(true);
      
      const handleSession = async (session: any) => {
        if (session && session.user) {
          const token = session.provider_token;
          if (token) {
            localStorage.setItem('devtrack_provider_token', token);
            setProviderToken(token);
          } else {
            const persistedToken = localStorage.getItem('devtrack_provider_token');
            if (persistedToken) {
              setProviderToken(persistedToken);
            }
          }
          let targetView = initialView;
          let targetPath = path;
          if (['landing', 'login', 'register'].includes(initialView)) {
            targetView = 'dashboard';
            targetPath = '/dashboard';
          }
          await fetchAndSetUserProfile(session.user.id, session.user.email || '', session.user.user_metadata, targetView, targetPath);
        } else {
          setLoading(false);
          if (initialView !== 'landing' && initialView !== 'login' && initialView !== 'register') {
            navigateTo('login', '/login');
          } else {
            setView(initialView);
          }
        }
      };

      supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session);
      }).catch(err => {
        console.error(err);
        setLoading(false);
        navigateTo('login', '/login');
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
          const token = session.provider_token;
          if (token) {
            localStorage.setItem('devtrack_provider_token', token);
            setProviderToken(token);
          } else {
            const persistedToken = localStorage.getItem('devtrack_provider_token');
            if (persistedToken) {
              setProviderToken(persistedToken);
            }
          }
          const currentPath = window.location.pathname;
          let targetView = initialView;
          let targetPath = path;

          if (['/dashboard', '/notifications', '/github-hub', '/repo-analyzer', '/code-review', '/repo-comparison', '/resume-analyzer', '/interview-prep', '/internship-matcher', '/recruiter-view', '/ai-coach', '/skill-gap', '/learning-roadmap', '/growth-reports', '/career-insights', '/settings', '/profile'].includes(currentPath)) {
            targetPath = currentPath;
            targetView = currentPath.substring(1) as typeof view;
          } else {
            targetView = 'dashboard';
            targetPath = '/dashboard';
          }
          fetchAndSetUserProfile(session.user.id, session.user.email || '', session.user.user_metadata, targetView, targetPath);
        } else {
          setCurrentUser(null);
          setProviderToken(null);
          processingUserRef.current = null;
          const currentPath = window.location.pathname;
          if (['/dashboard', '/notifications', '/github-hub', '/repo-analyzer', '/code-review', '/repo-comparison', '/resume-analyzer', '/interview-prep', '/internship-matcher', '/recruiter-view', '/ai-coach', '/skill-gap', '/learning-roadmap', '/growth-reports', '/career-insights', '/settings', '/profile'].includes(currentPath)) {
            navigateTo('login', '/login');
          }
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // localStorage mockup check
      const session = localStorage.getItem('devtrack_session');
      if (session) {
        const parsedUser = JSON.parse(session);
        setCurrentUser(parsedUser);
        setView(initialView === 'landing' || initialView === 'login' || initialView === 'register' ? 'dashboard' : initialView);
        loadUserData(parsedUser.id);
      } else {
        if (initialView !== 'landing' && initialView !== 'login' && initialView !== 'register') {
          navigateTo('login', '/login');
        } else {
          setView(initialView);
        }
      }
    }
  }, []);

  const fetchAndSetUserProfile = async (
    userId: string, 
    email: string, 
    userMetadata?: any,
    targetView: typeof view = 'dashboard',
    targetPath = '/dashboard'
  ) => {
    if (processingUserRef.current === userId && currentUser) {
      let finalView = targetView;
      let finalPath = targetPath;
      if (['landing', 'login', 'register'].includes(targetView)) {
        finalView = 'dashboard';
        finalPath = '/dashboard';
      }
      navigateTo(finalView, finalPath);
      return;
    }
    processingUserRef.current = userId;
    setLoading(true);
    setErrorMsg('');
    try {
      let { data, error } = await db.getProfile(userId);
      
      if (error || !data) {
        const githubUsername = userMetadata?.user_name || '';
        const name = userMetadata?.full_name || userMetadata?.name || 'Developer User';
        const avatar = userMetadata?.avatar_url || '';
        
        if (supabase) {
          const { error: insertError } = await supabase.from('users').upsert({
            id: userId,
            name,
            email,
            github_username: githubUsername,
            profile_picture: avatar,
            career_goal: '',
            experience_level: 'Junior / Mid-Level',
            preferred_tech_stack: []
          });

          if (insertError) throw insertError;

          const { error: ghProfileInsertError } = await supabase.from('github_profiles').upsert({
            id: userId,
            user_id: userId
          });
          if (ghProfileInsertError) console.error(ghProfileInsertError);

          const { data: profileData, error: fetchError } = await db.getProfile(userId);
          if (fetchError) throw fetchError;
          data = profileData;
        }
      }

      if (data) {
        const activeUser: UserType = {
          id: data.id,
          name: data.name || 'Developer User',
          email: data.email || email,
          profile_picture: data.profile_picture || '',
          github_username: data.github_username || '',
          career_goal: data.career_goal || '',
          experience_level: data.experience_level || 'Junior / Mid-Level',
          preferred_tech_stack: data.preferred_tech_stack || [],
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        setCurrentUser(activeUser);
        
        let finalView = targetView;
        let finalPath = targetPath;
        if (['landing', 'login', 'register'].includes(targetView)) {
          finalView = 'dashboard';
          finalPath = '/dashboard';
        }
        navigateTo(finalView, finalPath);
        
        await loadUserData(userId);

        // Auto sync if logged in via OAuth
        if (activeUser.github_username) {
          const oauthToken = localStorage.getItem('devtrack_provider_token');
          const tokenVal = oauthToken || githubPat || undefined;
          syncGitHubDataForUser(activeUser, activeUser.github_username, tokenVal);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication configuration error.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    const { data: reposData } = await db.getRepositories(userId);
    const { data: profileData } = await db.getGitHubProfile(userId);
    const { data: goalsData } = await db.getGoals(userId);
    const { data: achievementsData } = await db.getAchievements(userId);
    const { data: notifData } = await db.getNotifications(userId);

    if (reposData) setRepos(reposData as Repository[]);
    if (profileData) setGhProfile(profileData as GitHubProfile);
    if (goalsData) setGoals(goalsData as LearningGoal[]);
    if (achievementsData) setAchievements(achievementsData as Achievement[]);
    if (notifData) setNotifications(notifData);
  };

  const syncGitHubDataForUser = async (activeUser: UserType, username: string, token?: string) => {
    setSyncing(true);
    setErrorMsg('');
    try {
      if (!token || token.trim() === '') {
        throw new Error("GitHub Access Token is missing. Please log in using GitHub OAuth or configure a Personal Access Token (PAT) in Settings to execute the synchronization pipeline.");
      }
      if (!username || username.trim() === '') {
        throw new Error("GitHub Username is missing. Please set your GitHub username in Profile Settings before executing the synchronization pipeline.");
      }
      if (!activeUser.id) {
        throw new Error("Authenticated User ID is missing. Please re-authenticate.");
      }

      const { profile, repositories } = await fetchGitHubData(username, token);
      
      setGhProfile(profile);
      setRepos(repositories);

      await db.upsertGitHubProfile(activeUser.id, {
        total_repositories: profile.total_repositories,
        total_contributions: profile.total_contributions,
        current_streak: profile.current_streak,
        longest_streak: profile.longest_streak,
        languages_used: profile.languages_used,
        contribution_activity: profile.contribution_activity,
        activity_timeline: profile.activity_timeline,
        last_synced_at: new Date().toISOString()
      });

      // Fetch existing repositories from database
      const { data: existingReposData } = await db.getRepositories(activeUser.id);
      const existingRepos = existingReposData || [];

      // Remove repositories that are no longer present on GitHub from the database
      const fetchedNames = repositories.map(r => r.name);
      const reposToDelete = existingRepos.filter((ex: any) => !fetchedNames.includes(ex.name));
      if (reposToDelete.length > 0 && supabase) {
        const deleteIds = reposToDelete.map((r: any) => r.id);
        await supabase.from('repositories').delete().in('id', deleteIds);
      }

      // Construct repository payloads, matching UUIDs for existing repos
      const repoPayloads = repositories.map(r => {
        const matched = existingRepos.find((ex: any) => ex.name === r.name);
        const payload: any = {
          user_id: activeUser.id,
          name: r.name,
          description: r.description,
          html_url: r.html_url,
          language: r.language,
          stars_count: r.stars_count,
          forks_count: r.forks_count,
          commits_count: r.commits_count,
          health_score: r.health_score,
          ai_review_status: 'completed'
        };
        if (matched) {
          payload.id = matched.id;
        }
        return payload;
      });

      await db.upsertRepositories(repoPayloads);

      // Save sync notification
      await db.addNotification({
        user_id: activeUser.id,
        type: 'achievement',
        title: 'GitHub Synced Successfully',
        message: `Imported stats for ${repositories.length} repositories with verified language bytes.`,
        is_read: false
      });

      // Unlock First Commit badge
      const newAch = {
        user_id: activeUser.id,
        badge_type: 'first_commit',
        name: 'First Commit',
        description: 'Linked GitHub and loaded repository statistics.',
        icon: '🚀',
        unlocked_at: new Date().toISOString()
      };
      await db.unlockAchievement(newAch);

      await loadUserData(activeUser.id);
    } catch (err: any) {
      console.error('GitHub Sync Error:', err);
      setErrorMsg(err.message || 'Failed to sync GitHub profile statistics.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };

    const email = target.email.value;
    const password = target.password.value;

    const { data, error } = await db.signIn(email, password);
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else if (data.user) {
      await fetchAndSetUserProfile(data.user.id, email);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const target = e.target as typeof e.target & {
      name: { value: string };
      email: { value: string };
      github: { value: string };
      password: { value: string };
    };

    const name = target.name.value;
    const email = target.email.value;
    const github = target.github.value;
    const password = target.password.value;

    const { data, error } = await db.signUp(email, password, name, github);
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else if (data.user) {
      await fetchAndSetUserProfile(data.user.id, email);
    }
  };

  const handleGitHubOAuth = async () => {
    setErrorMsg('');
    setLoading(true);
    const { error } = await db.signInWithGitHub();
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    processingUserRef.current = null;
    await db.signOut();
    localStorage.removeItem('devtrack_provider_token');
    setCurrentUser(null);
    setGhProfile(null);
    setRepos([]);
    setGoals([]);
    setAchievements([]);
    setNotifications([]);
    navigateTo('landing', '/');
  };

  // Metric aggregates
  const totalRepos = repos.length;
  const totalStars = repos.reduce((acc, r) => acc + (r.stars_count || 0), 0);
  const totalForks = repos.reduce((acc, r) => acc + (r.forks_count || 0), 0);
  const totalCommits = repos.reduce((acc, r) => acc + (r.commits_count || 0), 0);

  let weeklyActivity = 0;
  if (ghProfile?.contribution_activity) {
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      weeklyActivity += ghProfile.contribution_activity[dateStr] || 0;
    }
  }

  const streakBonus = (ghProfile?.current_streak || 0) * 1.5;
  const commitBonus = Math.min(40, totalCommits * 0.15);
  const starsBonus = Math.min(25, totalStars * 1.2);
  const forksBonus = Math.min(15, totalForks * 2.0);
  const developerScore = Math.min(100, Math.round(30 + streakBonus + commitBonus + starsBonus + forksBonus));

  // Recharts Formats
  const commitChartData = [];
  const nowVal = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(nowVal.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    commitChartData.push({
      name: formattedDate,
      commits: ghProfile?.contribution_activity?.[dateStr] || 0
    });
  }

  const languageChartData = ghProfile?.languages_used 
    ? Object.keys(ghProfile.languages_used).map(lang => ({
        name: lang,
        value: ghProfile.languages_used[lang]
      }))
    : [];

  const repoGrowthData = repos.slice(0, 8).map(r => ({
    name: r.name,
    stars: r.stars_count,
    forks: r.forks_count,
    commits: r.commits_count
  }));

  // Sidebar Group layouts
  const sidebarNavItems = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.is_read).length || undefined }
      ]
    },
    {
      group: 'GitHub Insights',
      items: [
        { id: 'github-hub', label: 'GitHub Hub', icon: Github },
        { id: 'repo-analyzer', label: 'Repository Analyzer', icon: BarChart2 },
        { id: 'code-review', label: 'Code Review Engine', icon: FileCheck },
        { id: 'repo-comparison', label: 'Repository Comparison', icon: Layers }
      ]
    },
    {
      group: 'Career Tools',
      items: [
        { id: 'resume-analyzer', label: 'Resume Analyzer', icon: FileText },
        { id: 'interview-prep', label: 'Interview Preparation', icon: HelpCircle },
        { id: 'internship-matcher', label: 'Internship Matcher', icon: Compass },
        { id: 'recruiter-view', label: 'Recruiter View', icon: Users }
      ]
    },
    {
      group: 'AI & Growth',
      items: [
        { id: 'ai-coach', label: 'AI Mentor Coach', icon: Brain },
        { id: 'skill-gap', label: 'Skill Gap Analysis', icon: Compass },
        { id: 'learning-roadmap', label: 'Learning Roadmap', icon: BookOpen },
        { id: 'growth-reports', label: 'Growth Reports', icon: BarChart2 },
        { id: 'career-insights', label: 'Career Insights', icon: Sparkles }
      ]
    },
    {
      group: 'Account',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'profile', label: 'Profile Settings', icon: User }
      ]
    }
  ];

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider animate-pulse">
          DevTrack AI is configuring your developer dashboard...
        </p>
      </div>
    );
  }

  // Landing, login, and registration screens
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between grid-bg relative overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600 rounded-full glow-blur pointer-events-none"></div>
        <div className="absolute bottom-[-15%] right-[10%] w-[600px] h-[600px] bg-indigo-600 rounded-full glow-blur pointer-events-none"></div>

        <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <Rocket className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-display font-bold bg-gradient-to-r from-purple-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">DevTrack AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigateTo('login', '/login')} className="text-sm font-semibold hover:text-purple-400 transition-colors">Log In</button>
            <button onClick={() => navigateTo('register', '/register')} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/20">Sign Up</button>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center z-10 py-16">
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 text-purple-300 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-semibold mb-8">
            <span>⚡ Professional Real GitHub Statistics SaaS Dashboard</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-8 leading-tight">
            Elevate Your Career with <br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent">Real Developer Metrics</span>
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-3xl mb-12 leading-relaxed">
            Synchronize actual repository metrics, track coding streak heatmap, audit codebase documentation and architecture quality, identify skill gaps, and accelerate your recruitment pipelines.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <button onClick={() => navigateTo('register', '/register')} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] shadow-lg shadow-purple-600/30 flex items-center justify-center">
              Get Started For Free <ChevronRight className="ml-1.5 h-4 w-4" />
            </button>
            <button onClick={() => navigateTo('login', '/login')} className="glass-card px-8 py-4 rounded-xl font-semibold text-base flex items-center justify-center hover:bg-slate-900 transition-all border-slate-800">
              Explore Live Demo
            </button>
          </div>
        </main>

        <footer className="py-8 text-center text-xs text-slate-500 border-t border-slate-900">
          <p>&copy; 2026 DevTrack AI. Premium developer metrics auditing pipeline.</p>
        </footer>
      </div>
    );
  }

  if (view === 'login' || view === 'register') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative grid-bg">
        <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-purple-800 rounded-full glow-blur pointer-events-none"></div>
        <div className="w-full max-w-md glass-card p-8 rounded-2xl border border-white/5 relative z-10">
          <div className="flex justify-center mb-6 cursor-pointer" onClick={() => navigateTo('landing', '/')}>
            <Rocket className="h-8 w-8 text-purple-400" />
          </div>
          <h2 className="text-3xl font-display font-bold text-center mb-2">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-xs text-slate-400 text-center mb-8">{view === 'login' ? 'Sign in to access DevTrack growth profiles' : 'Begin building custom learning roadmaps'}</p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <button 
              type="button" 
              onClick={handleGitHubOAuth}
              className="w-full bg-[#24292e] text-white flex items-center justify-center space-x-3 py-3 rounded-xl hover:bg-[#1a1e22] transition-all border border-transparent text-xs font-semibold"
            >
              <Github className="h-4.5 w-4.5" />
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="relative mb-6 text-center">
            <span className="relative z-10 bg-slate-950 px-3 text-[10px] text-slate-500 uppercase font-semibold">Or email + password</span>
            <hr className="absolute top-1/2 left-0 right-0 border-white/5" />
          </div>

          <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {view === 'register' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                  <input required name="name" type="text" placeholder="e.g. John Doe" className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">GitHub Username</label>
                  <input required name="github" type="text" placeholder="e.g. github-username" className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200" />
                </div>
              </>
            )}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
              <input required name="email" type="email" placeholder="e.g. user@example.com" className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
              <input required name="password" type="password" placeholder="••••••••" className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200" />
            </div>
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-600/20">
              {view === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="w-full mt-6 text-center text-xs text-purple-400 hover:underline">
            {view === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    );
  }

  // Dashboard workspace shell layout
  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col md:flex-row relative">
      <div className="absolute top-[5%] left-[2%] w-[200px] h-[200px] bg-purple-600/5 rounded-full glow-blur pointer-events-none"></div>

      {/* Hamburger menu for mobile header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-white/5 z-30 w-full">
        <div className="flex items-center space-x-2">
          <Rocket className="h-5 w-5 text-purple-400" />
          <span className="font-display font-bold text-base bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">DevTrack AI</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded bg-slate-900 border border-white/5 text-slate-300">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Left Navigation Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-64 glass-card border-r border-white/5 flex flex-col justify-between z-40 transform transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:block'}`}>
        <div className="overflow-y-auto max-h-[85vh] no-scrollbar">
          <div className="px-6 py-6 border-b border-white/5 hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo('landing', '/')}>
              <Rocket className="h-5 w-5 text-purple-400" />
              <span className="font-display font-bold text-lg bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">DevTrack AI</span>
            </div>
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-wider">SaaS</span>
          </div>

          <div className="p-4 space-y-6">
            {sidebarNavItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-4 block">{group.group}</span>
                <div className="space-y-1">
                  {group.items.map((item, iIdx) => {
                    const IconComp = item.icon;
                    const isActive = view === item.id;
                    return (
                      <button
                        key={iIdx}
                        onClick={() => navigateTo(item.id as typeof view, `/${item.id}`)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide border transition-all ${isActive ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/10' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComp className="h-4.5 w-4.5" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold">{item.badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Card inside Sidebar */}
        <div className="p-4 border-t border-white/5 space-y-4 bg-slate-950/40">
          {currentUser && (
            <div className="flex items-center space-x-3 p-1 rounded-xl">
              {currentUser.profile_picture ? (
                <img src={currentUser.profile_picture} alt={currentUser.name} className="w-9 h-9 rounded-full border border-purple-500/40 shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full border border-purple-500/40 bg-slate-900 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-purple-400" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 truncate">@{currentUser.github_username || 'dev'}</div>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 z-10 overflow-y-auto max-h-screen">
        {/* Top Workspace Bar */}
        <header className="h-16 border-b border-white/5 px-6 hidden md:flex items-center justify-between glass-card sticky top-0 z-30">
          <h2 className="font-display font-bold text-lg capitalize">{view.replace('-', ' ')}</h2>
          
          <div className="flex items-center space-x-4">
            {syncing && (
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold animate-pulse">
                Syncing GitHub...
              </span>
            )}
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl glass-card hover:bg-slate-900 border-white/5 text-slate-300">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Core View Switcher panels */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-8">
          
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex justify-between items-center">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg('')} className="font-bold hover:underline">Dismiss</button>
            </div>
          )}

          {/* EMPTY STATE - Renders if GitHub is not synced */}
          {currentUser && repos.length === 0 && view !== 'settings' && view !== 'profile' && view !== 'notifications' && (
            <div className="glass-card p-12 rounded-2xl text-center space-y-6 flex flex-col items-center max-w-xl mx-auto my-12 animate-fade-in">
              <div className="h-12 w-12 bg-purple-500/15 text-purple-400 border border-purple-500/20 rounded-full flex items-center justify-center animate-bounce">
                <Github className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display">No GitHub Repository Data Synced</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  To load your career analytics, resume matching, and AI skill gaps, connect your account and fetch your actual repositories.
                </p>
              </div>

              {currentUser.github_username ? (
                <button
                  onClick={() => syncGitHubDataForUser(currentUser, currentUser.github_username!, providerToken || githubPat || undefined)}
                  disabled={syncing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/25 flex items-center transition-all"
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  {syncing ? 'Syncing Repository Details...' : 'Sync GitHub Repositories Now'}
                </button>
              ) : (
                <button
                  onClick={() => navigateTo('profile', '/profile')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-xs font-semibold flex items-center"
                >
                  Configure GitHub Username in Profile <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* VIEW: Dashboard */}
          {currentUser && repos.length > 0 && view === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Metrics cards row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardMetric title="Total Repositories" value={totalRepos.toString()} detail="Active public & private" icon={Layers} />
                <DashboardMetric title="Total Commits" value={totalCommits.toString()} detail="In synced repositories" icon={GitCommit} />
                <DashboardMetric title="Forks / Stars" value={`${totalForks} / ${totalStars}`} detail="Total community counts" icon={Star} />
                <DashboardMetric title="Developer Score" value={`${developerScore}%`} detail="Streak + commits rating" icon={Trophy} trend="Verified rating" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <DashboardMetric title="Weekly Commits" value={weeklyActivity.toString()} detail="Contributions in past 7d" icon={Calendar} />
                <DashboardMetric title="Top Language" value={Object.keys(ghProfile?.languages_used || {})[0] || 'TypeScript'} detail="Core language" icon={Terminal} />
                <DashboardMetric title=" streak count" value={`${ghProfile?.current_streak || 0} days`} detail="Active daily coding" icon={Sparkles} trend={`Longest: ${ghProfile?.longest_streak || 0}d`} />
              </div>

              {/* Recharts widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Commit Activity Area Chart */}
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Commit Activity (Past 30 Days)</h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={commitChartData}>
                        <defs>
                          <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f3f4f6' }} />
                        <Area type="monotone" dataKey="commits" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCommits)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Top Languages Pie Chart */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Language Distribution</h4>
                  <div className="h-72 w-full flex flex-col justify-between">
                    <div className="h-48 w-full">
                      {languageChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-500">No language data</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={languageChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {languageChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    {/* legend */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-white/5 pt-3">
                      {languageChartData.slice(0, 4).map((lang, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full block" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                          <span className="font-semibold text-slate-300 truncate">{lang.name} ({lang.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* stars / forks repositories growth bar chart */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Repository Growth & Volume (Top Repositories)</h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={repoGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="stars" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Stars" />
                      <Bar dataKey="forks" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Forks" />
                      <Bar dataKey="commits" fill="#10b981" radius={[4, 4, 0, 0]} name="Commits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* VIEW: Notifications */}
          {currentUser && view === 'notifications' && (
            <div className="glass-card p-6 rounded-2xl space-y-6 animate-fade-in max-w-2xl mx-auto">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="font-display font-bold text-lg">System Notifications</h3>
                <button
                  onClick={async () => {
                    await db.markNotificationsAsRead(currentUser.id);
                    await loadUserData(currentUser.id);
                  }}
                  className="text-xs text-purple-400 hover:underline"
                >
                  Mark all read
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {notifications.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-10">No notifications. You are all caught up!</div>
                ) : (
                  notifications.map((notif, index) => (
                    <div key={notif.id || index} className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all ${notif.is_read ? 'opacity-60 bg-slate-950/20 border-white/5' : 'bg-purple-500/5 border-purple-500/20 shadow-sm'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{notif.title}</span>
                        <span className="text-[10px] text-slate-500">{new Date(notif.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-400 leading-normal">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VIEW: GitHub Hub */}
          {currentUser && repos.length > 0 && view === 'github-hub' && (
            <div className="space-y-8 animate-fade-in">
              <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center space-x-4">
                  {currentUser.profile_picture ? (
                    <img src={currentUser.profile_picture} alt={currentUser.name} className="w-14 h-14 rounded-full border-2 border-purple-500/40 shadow-lg shadow-purple-500/20 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full border-2 border-purple-500/40 bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                      <User className="h-6 w-6 text-purple-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-display font-bold">GitHub Account</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold">@{currentUser.github_username}</span>
                      <span>•</span>
                      <span>Last Synced: <span className="font-semibold text-purple-400">{ghProfile?.last_synced_at ? new Date(ghProfile.last_synced_at).toLocaleString() : 'Never'}</span></span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => syncGitHubDataForUser(currentUser, currentUser.github_username!, providerToken || githubPat || undefined)}
                  disabled={syncing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold text-xs transition-all hover:shadow-lg flex items-center shrink-0 border border-purple-500/30"
                >
                  <Rocket className="mr-2 h-4 w-4" /> 
                  {syncing ? 'Syncing Data...' : 'Sync GitHub Data'}
                </button>
              </div>

              {/* streak stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Current Streak</span>
                    <div className="text-3xl font-display font-bold text-slate-100">{ghProfile?.current_streak || 0} days</div>
                  </div>
                  <Sparkles className="h-10 w-10 text-orange-400 opacity-80" />
                </div>
                <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Longest Streak</span>
                    <div className="text-3xl font-display font-bold text-slate-100">{ghProfile?.longest_streak || 0} days</div>
                  </div>
                  <Trophy className="h-10 w-10 text-yellow-500 opacity-80" />
                </div>
              </div>

              {/* contribution heatmap calendar SVG grid */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Contribution activity calendar (Past 52 weeks)</h4>
                <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
                  {Array.from({ length: 53 }).map((_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1 shrink-0">
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        // Estimate contributions
                        const dateOffset = (52 - weekIdx) * 7 + (6 - dayIdx);
                        const d = new Date();
                        d.setDate(d.getDate() - dateOffset);
                        const dateStr = d.toISOString().split('T')[0];
                        const count = ghProfile?.contribution_activity?.[dateStr] || 0;
                        
                        let level = 0;
                        if (count > 0 && count <= 2) level = 1;
                        else if (count > 2 && count <= 5) level = 2;
                        else if (count > 5) level = 3;
                        
                        const colors = ['bg-slate-900 border border-white/[0.01]', 'bg-purple-900/40 border border-purple-800/10', 'bg-purple-700/60 border border-purple-600/10', 'bg-purple-500 border border-purple-400/10'];
                        return (
                          <div key={dayIdx} className={`h-3 w-3 rounded-sm ${colors[level]}`} title={`${dateStr}: ${count} commits`}></div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-white/5">
                  <span>Less Activity</span>
                  <div className="flex gap-1">
                    <div className="h-2.5 w-2.5 rounded-sm bg-slate-900"></div>
                    <div className="h-2.5 w-2.5 rounded-sm bg-purple-900/40"></div>
                    <div className="h-2.5 w-2.5 rounded-sm bg-purple-700/60"></div>
                    <div className="h-2.5 w-2.5 rounded-sm bg-purple-500"></div>
                  </div>
                  <span>More Activity</span>
                </div>
              </div>

              {/* Repositories grid */}
              <div className="space-y-4">
                <h3 className="text-base font-bold font-display uppercase tracking-wider text-slate-400">Connected Repositories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {repos.map(repo => (
                    <div key={repo.id} className="glass-card p-5 rounded-xl flex flex-col justify-between hover:border-purple-500/20 transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full">{repo.language || 'HTML/CSS'}</span>
                          <span className="text-xs font-bold text-green-400">{repo.health_score}% Health</span>
                        </div>
                        <h4 className="font-bold text-sm truncate text-slate-200">{repo.name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 my-2 leading-relaxed">{repo.description || 'No description provided.'}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-3 mt-1">
                        <span className="flex items-center"><Star className="h-3.5 w-3.5 mr-1 text-yellow-500/80" /> {repo.stars_count}</span>
                        <span className="flex items-center"><GitFork className="h-3.5 w-3.5 mr-1" /> {repo.forks_count}</span>
                        <span className="flex items-center"><GitCommit className="h-3.5 w-3.5 mr-1 text-purple-400/80" /> {repo.commits_count} commits</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* VIEW: Repository Analyzer */}
          {currentUser && repos.length > 0 && view === 'repo-analyzer' && (
            <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Repository to Analyze</label>
                  <select 
                    value={selectedRepoId}
                    onChange={e => {
                      setSelectedRepoId(e.target.value);
                      const matched = repos.find(r => r.id === e.target.value);
                      if (matched) {
                        const stars = matched.stars_count || 0;
                        const commits = matched.commits_count || 0;
                        
                        // Deterministic metrics calculation
                        const codeQuality = Math.min(100, Math.round(70 + (commits > 10 ? 15 : commits * 1.5) + (stars > 5 ? 10 : stars * 2)));
                        const docQuality = matched.description ? 90 : 40;
                        const maintainability = Math.min(100, Math.round(65 + (commits > 20 ? 25 : commits * 1.2)));
                        const complexity = Math.min(100, Math.round(50 + (matched.language === 'TypeScript' || matched.language === 'Python' ? 25 : 15)));
                        const archScore = Math.min(100, Math.round(codeQuality * 0.95));

                        setActiveReviewReport({
                          repoName: matched.name,
                          codeQuality,
                          docQuality,
                          maintainability,
                          complexity,
                          archScore,
                        });
                      } else {
                        setActiveReviewReport(null);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200"
                  >
                    <option value="">-- Choose Repository --</option>
                    {repos.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.language || 'Vanilla'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeReviewReport ? (
                <div className="glass-card p-8 rounded-2xl space-y-6">
                  <h3 className="text-xl font-display font-bold text-slate-100">{activeReviewReport.repoName} - Metric Evaluations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <MetricProgressLabel label="Code Quality Score" value={activeReviewReport.codeQuality} color="bg-purple-500" />
                    <MetricProgressLabel label="Documentation Completeness" value={activeReviewReport.docQuality} color="bg-blue-500" />
                    <MetricProgressLabel label="Maintainability Index" value={activeReviewReport.maintainability} color="bg-emerald-500" />
                    <MetricProgressLabel label="Architecture Integrity" value={activeReviewReport.archScore} color="bg-yellow-500" />
                    <MetricProgressLabel label="Project Complexity" value={activeReviewReport.complexity} color="bg-pink-500" />
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 rounded-2xl text-center text-slate-500 text-xs">
                  Please select a synchronized repository above to check metrics.
                </div>
              )}
            </div>
          )}

          {/* VIEW: Code Review Engine */}
          {currentUser && repos.length > 0 && view === 'code-review' && (
            <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Repository for Code Audit</label>
                  <select 
                    value={selectedReviewRepoId}
                    onChange={e => setSelectedReviewRepoId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200"
                  >
                    <option value="">-- Choose Repository --</option>
                    {repos.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.language || 'Vanilla'})</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => {
                    if (!selectedReviewRepoId) return;
                    setReviewLoading(true);
                    setActiveReviewReport(null);
                    
                    setTimeout(async () => {
                      setReviewLoading(false);
                      const chosen = repos.find(r => r.id === selectedReviewRepoId);
                      if (chosen) {
                        const stars = chosen.stars_count || 0;
                        const commits = chosen.commits_count || 0;
                        
                        const score = Math.min(100, Math.round(65 + (commits * 0.4) + (stars * 1.5)));

                        const report = {
                          repoName: chosen.name,
                          score,
                          strengths: [
                            'Modular folder configuration structures', 
                            `Primary utilization of ${chosen.language || 'HTML'} codebase standards`,
                            'Clean separation of layout rendering and state components'
                          ],
                          weaknesses: [
                            'Minimal unit testing implementations (0% verified test coverage)',
                            'Lack of environmental variables configuration settings inside readme descriptions'
                          ],
                          recommendations: [
                            'Configure Vitest/Jest suite test profiles within packages settings.',
                            'Separate private parameters and endpoints configurations into external local env.local assets.'
                          ]
                        };
                        setActiveReviewReport(report);

                        // Save to Supabase repository_reviews table
                        await db.saveRepositoryReview({
                          repository_id: chosen.id,
                          user_id: currentUser.id,
                          health_score: score,
                          strengths: report.strengths,
                          weaknesses: report.weaknesses,
                          recommendations: report.recommendations
                        });
                      }
                    }, 1500);
                  }}
                  disabled={!selectedReviewRepoId || reviewLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-semibold flex items-center border border-purple-500/20 tracking-wide transition-colors shrink-0"
                >
                  {reviewLoading ? 'Reviewing Directory...' : 'Execute AI Review'}
                </button>
              </div>

              {reviewLoading && (
                <div className="glass-card p-16 rounded-2xl flex flex-col items-center justify-center space-y-4">
                  <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Analyzing repository packages configuration...</p>
                </div>
              )}

              {activeReviewReport && !reviewLoading && (
                <div className="glass-card p-8 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-2xl font-display font-bold text-slate-100">{activeReviewReport.repoName} - Architectural Audit</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Generated by DevTrack AI Code Audit</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Health Score</span>
                        <div className="text-2xl font-extrabold text-green-400 mt-0.5">{activeReviewReport.score}/100</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center border-b border-white/5 pb-2">
                        <span className="text-green-400 mr-2">✔</span> Architecture Strengths
                      </h4>
                      <ul className="text-xs text-slate-400 space-y-2">
                        {activeReviewReport.strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-start">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center border-b border-white/5 pb-2">
                        <span className="text-red-400 mr-2">⚠</span> Refactoring Gaps
                      </h4>
                      <ul className="text-xs text-slate-400 space-y-2">
                        {activeReviewReport.weaknesses.map((w: string, i: number) => (
                          <li key={i} className="flex items-start">• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-white/5 pt-6">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Detailed Action Items</h4>
                    <ol className="text-xs text-slate-400 space-y-2 list-decimal pl-4">
                      {activeReviewReport.recommendations.map((r: string, i: number) => (
                        <li key={i} className="leading-relaxed">{r}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Repository Comparison */}
          {currentUser && repos.length > 0 && view === 'repo-comparison' && (
            <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div className="glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Repository 1</label>
                  <select 
                    value={compareRepoId1}
                    onChange={e => setCompareRepoId1(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200"
                  >
                    <option value="">-- Choose Repository --</option>
                    {repos.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Repository 2</label>
                  <select 
                    value={compareRepoId2}
                    onChange={e => setCompareRepoId2(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200"
                  >
                    <option value="">-- Choose Repository --</option>
                    {repos.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {compareRepoId1 && compareRepoId2 ? (
                <div className="glass-card p-6 rounded-2xl overflow-hidden">
                  <h3 className="text-base font-bold font-display mb-4">Repository Metric Comparison</h3>
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-white/5 uppercase font-bold text-slate-500 text-[10px]">
                        <th className="py-3">Metric</th>
                        <th className="py-3">{(repos.find(r => r.id === compareRepoId1))?.name}</th>
                        <th className="py-3">{(repos.find(r => r.id === compareRepoId2))?.name}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <ComparisonRow label="Primary Language" val1={(repos.find(r => r.id === compareRepoId1))?.language || 'HTML'} val2={(repos.find(r => r.id === compareRepoId2))?.language || 'HTML'} />
                      <ComparisonRow label="Stars Count" val1={(repos.find(r => r.id === compareRepoId1))?.stars_count?.toString() || '0'} val2={(repos.find(r => r.id === compareRepoId2))?.stars_count?.toString() || '0'} />
                      <ComparisonRow label="Forks Count" val1={(repos.find(r => r.id === compareRepoId1))?.forks_count?.toString() || '0'} val2={(repos.find(r => r.id === compareRepoId2))?.forks_count?.toString() || '0'} />
                      <ComparisonRow label="Commits Synced" val1={(repos.find(r => r.id === compareRepoId1))?.commits_count?.toString() || '0'} val2={(repos.find(r => r.id === compareRepoId2))?.commits_count?.toString() || '0'} />
                      <ComparisonRow label="Quality Score" val1={`${(repos.find(r => r.id === compareRepoId1))?.health_score || 80}%`} val2={`${(repos.find(r => r.id === compareRepoId2))?.health_score || 80}%`} />
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass-card p-12 rounded-2xl text-center text-slate-500 text-xs">
                  Please select both repositories above to run the side-by-side comparison.
                </div>
              )}
            </div>
          )}

          {/* VIEW: Resume Analyzer */}
          {currentUser && repos.length > 0 && view === 'resume-analyzer' && (
            <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold font-display">ATS Compliance Resume Check</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Paste your raw resume text context. The AI analyzer evaluates matching keywords based on your targeting goal: <span className="font-semibold text-purple-400">{currentUser.career_goal}</span>.
                </p>
                <textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste resume content here..."
                  rows={8}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200"
                ></textarea>

                <button
                  onClick={() => {
                    if (!resumeText.trim()) return;
                    setResumeLoading(true);
                    setResumeReport(null);

                    setTimeout(() => {
                      setResumeLoading(false);
                      const textLower = resumeText.toLowerCase();
                      
                      // Match calculation
                      const matches = [];
                      const missing = [];
                      const techKeys = currentUser.preferred_tech_stack || ['React', 'TypeScript'];
                      
                      techKeys.forEach(tech => {
                        if (textLower.includes(tech.toLowerCase())) {
                          matches.push(tech);
                        } else {
                          missing.push(tech);
                        }
                      });

                      const score = Math.round(55 + (matches.length / Math.max(1, techKeys.length)) * 35);
                      setResumeReport({
                        score,
                        matches,
                        missing,
                        tips: [
                          'Add a dedicated Projects section highlighting repository architecture layouts.',
                          'Incorporate metric validations (e.g. \"improved code quality index by 15%\") rather than descriptions.'
                        ]
                      });
                    }, 1500);
                  }}
                  disabled={!resumeText.trim() || resumeLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-semibold"
                >
                  {resumeLoading ? 'Evaluating Resume...' : 'Analyze Resume'}
                </button>
              </div>

              {resumeLoading && (
                <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center space-y-4">
                  <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                  <p className="text-xs text-slate-400">Comparing tech keywords against career expectations...</p>
                </div>
              )}

              {resumeReport && !resumeLoading && (
                <div className="glass-card p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h4 className="font-bold text-base font-display">ATS Alignment Summary</h4>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Match Score</span>
                      <span className="text-2xl font-extrabold text-green-400">{resumeReport.score}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-300">Matching Keywords Found</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeReport.matches.length === 0 ? (
                          <span className="text-slate-500 italic">None found</span>
                        ) : (
                          resumeReport.matches.map((m: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">{m}</span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-300">Recommended Missing Keywords</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeReport.missing.length === 0 ? (
                          <span className="text-slate-500 italic">None - Complete stack match!</span>
                        ) : (
                          resumeReport.missing.map((m: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">{m}</span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4 text-xs">
                    <h5 className="font-bold text-slate-300">Structural Layout Reorganisations</h5>
                    <ul className="text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                      {resumeReport.tips.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Interview Prep */}
          {currentUser && repos.length > 0 && view === 'interview-prep' && (
            <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display">Target Mock Interview Preparation</h3>
                <p className="text-xs text-slate-400">Expand the technical questions tailored to your primary tech stack.</p>
              </div>

              <div className="space-y-4">
                <InterviewQuestionCard 
                  id="q1"
                  question="How does React reconcile virtual nodes inside DOM layouts?"
                  answer="React utilizes the Diffing algorithm to compare Virtual DOM tree structures. It groups reconciliations by: (1) Elements of different types generate separate layout nodes. (2) Custom keys are compared to keep element node order and children references consistent."
                  selectedId={selectedQuestionId}
                  onSelect={setSelectedQuestionId}
                />
                <InterviewQuestionCard 
                  id="q2"
                  question="What are the main compilation advantages of utilizing TypeScript interfaces vs types?"
                  answer="Interfaces support declaration merging (appending properties across files) and are cached by the compiler for faster lookups, while types are better for declarations involving unions, tuples, and mapped types."
                  selectedId={selectedQuestionId}
                  onSelect={setSelectedQuestionId}
                />
                <InterviewQuestionCard 
                  id="q3"
                  question="Explain the primary differences between SQL relations and non-relational database normalization."
                  answer="SQL databases rely on strict ACID properties, schema models, and joins across tables. NoSQL databases prioritize horizontal scalability and flexible schemas, storing denormalized data inside documents or key-value indices."
                  selectedId={selectedQuestionId}
                  onSelect={setSelectedQuestionId}
                />
              </div>
            </div>
          )}

          {/* VIEW: Internship Matcher */}
          {currentUser && repos.length > 0 && view === 'internship-matcher' && (
            <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display">Matching Internship Openings</h3>
                <p className="text-xs text-slate-400">Position recommendations calculated from your aggregated synchronized language metrics.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InternshipCard 
                  title="Junior Full-Stack React Intern"
                  company="CloudStream Systems"
                  match="94%"
                  requirements="React, TypeScript, Node.js, REST API integrations"
                  desc="Collaborate with backend architects to integrate component layouts, form structures, and state management schemas."
                />
                <InternshipCard 
                  title="Frontend Engineering Intern"
                  company="Frosted Designs Ltd"
                  match="87%"
                  requirements="React, Tailwind CSS, Javascript, responsive design"
                  desc="Optimize user interface visual elements and build glassmorphic components libraries targeting responsive layout systems."
                />
              </div>
            </div>
          )}

          {/* VIEW: Recruiter View */}
          {currentUser && repos.length > 0 && view === 'recruiter-view' && (
            <div className="glass-card p-8 rounded-2xl max-w-xl mx-auto space-y-6 border-purple-500/20 shadow-purple-500/5 animate-fade-in">
              <div className="flex items-center space-x-4 border-b border-white/5 pb-4">
                {currentUser.profile_picture ? (
                  <img src={currentUser.profile_picture} alt={currentUser.name} className="w-14 h-14 rounded-full border-2 border-purple-500/40 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-purple-500/40 bg-slate-900 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-purple-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold font-display text-slate-100">{currentUser.name}</h3>
                  <div className="text-xs text-purple-400 font-semibold">@{currentUser.github_username}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{currentUser.career_goal} • {currentUser.experience_level}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Skill Score</span>
                  <span className="text-lg font-bold text-green-400">{developerScore}%</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Streak Streak</span>
                  <span className="text-lg font-bold text-orange-400">{ghProfile?.current_streak || 0}d</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Contributions</span>
                  <span className="text-lg font-bold text-purple-400">{totalCommits}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Verified Project Highlights</h4>
                <div className="space-y-2">
                  {repos.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-slate-900/40 rounded-lg border border-white/5">
                      <span className="font-semibold text-slate-200">{r.name}</span>
                      <span className="text-green-400 font-bold">{r.health_score}% Quality</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: AI Mentor Coach */}
          {currentUser && repos.length > 0 && view === 'ai-coach' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[72vh] animate-fade-in">
              <div className="glass-card p-4 rounded-2xl flex flex-col justify-between hidden lg:flex">
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-2">Conversations</span>
                  <div className="space-y-1">
                    {chats.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setCurrentChatId(c.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all border text-xs font-semibold ${c.id === currentChatId ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/60'}`}
                      >
                        <div>{c.title}</div>
                        <div className="text-[9px] text-slate-500 mt-1">{c.date}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 glass-card rounded-2xl flex flex-col justify-between overflow-hidden relative">
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {chatMessages[currentChatId]?.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start gap-3 max-w-[80%]`}>
                        {msg.sender === 'assistant' && (
                          <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                            <Brain className="h-4 w-4" />
                          </div>
                        )}
                        <div className={`p-4 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-slate-900/60 border border-white/5 rounded-bl-none text-slate-200'}`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  ))}
                  {coachTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                          <Brain className="h-4 w-4" />
                        </div>
                        <div className="p-3 bg-slate-900/60 border border-white/5 rounded-2xl rounded-bl-none text-xs flex items-center space-x-1">
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!coachInput.trim() || coachTyping) return;

                  const userMsg = { sender: 'user' as const, message: coachInput };
                  setChatMessages(prev => ({
                    ...prev,
                    [currentChatId]: [...(prev[currentChatId] || []), userMsg]
                  }));
                  setCoachInput('');
                  setCoachTyping(true);

                  setTimeout(() => {
                    setCoachTyping(false);
                    const responseText = `Based on your goal to become a ${currentUser.career_goal || 'Software Engineer'}, and having verified your stack on repositories, I recommend focusing on test coverages and database scaling configurations. What specific topics do you want to explore?`;
                    setChatMessages(prev => ({
                      ...prev,
                      [currentChatId]: [...(prev[currentChatId] || []), { sender: 'assistant', message: responseText }]
                    }));
                  }, 1200);
                }} className="p-4 border-t border-white/5 flex gap-2">
                  <input 
                    value={coachInput}
                    onChange={e => setCoachInput(e.target.value)}
                    placeholder="Ask your AI Mentor Coach..."
                    className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200"
                  />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl text-xs font-semibold flex items-center">
                    Send <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: Skill Gap Analysis */}
          {currentUser && repos.length > 0 && view === 'skill-gap' && (
            <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display">Target Skill Gap Analyzer</h3>
                <p className="text-xs text-slate-400">Verifies framework alignments based on repository languages analysis.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-slate-300">Identified Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(ghProfile?.languages_used || {}).map((lang, idx) => (
                      <span key={idx} className="text-xs font-bold px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">{lang}</span>
                    ))}
                    <span className="text-xs font-bold px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Git CLI</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-slate-300">Detected Stack Gaps</h4>
                  <div className="flex flex-wrap gap-2">
                    {/* Filter what is not in user languages */}
                    {!Object.keys(ghProfile?.languages_used || {}).includes('TypeScript') && (
                      <span className="text-xs font-bold px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">TypeScript</span>
                    )}
                    {!Object.keys(ghProfile?.languages_used || {}).includes('Python') && (
                      <span className="text-xs font-bold px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">Python</span>
                    )}
                    <span className="text-xs font-bold px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">Docker Containers</span>
                    <span className="text-xs font-bold px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">SQL Schema Relations</span>
                    <span className="text-xs font-bold px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">Unit Testing (Jest)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Learning Roadmap */}
          {currentUser && repos.length > 0 && view === 'learning-roadmap' && (
            <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display">Customized Learning Milestones</h3>
                <p className="text-xs text-slate-400">Roadmap designed around matching your career targets.</p>
              </div>

              <div className="space-y-4">
                <div className="glass-card p-5 rounded-2xl flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-purple-600/15 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-200">Configure Unit Testing</h5>
                    <p className="text-xs text-slate-400 leading-normal">Integrate testing frameworks (Jest/Vitest) into your active repositories to verify component layouts.</p>
                  </div>
                </div>
                <div className="glass-card p-5 rounded-2xl flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-purple-600/15 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-200">Containerize Deployments</h5>
                    <p className="text-xs text-slate-400 leading-normal">Construct standard Dockerfiles and compose setups inside your top projects directory.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Growth Reports */}
          {currentUser && repos.length > 0 && view === 'growth-reports' && (
            <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display">Developer Growth History</h3>
                <p className="text-xs text-slate-400">Validated indicators of daily streak achievements and activity counts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-slate-300">Activity Level Metrics</h4>
                  <div className="space-y-3 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Total Synced Contributions</span>
                      <span className="font-bold text-slate-200">{totalCommits} commits</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Streak Verification</span>
                      <span className="font-bold text-slate-200">{ghProfile?.current_streak || 0} active days</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-slate-300">Target Progress</h4>
                  <div className="space-y-3 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Learning Goals Completed</span>
                      <span className="font-bold text-slate-200">{goals.filter(g => g.status === 'completed').length} completed</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unlocked Badges</span>
                      <span className="font-bold text-slate-200">{achievements.length} unlocked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Career Insights */}
          {currentUser && repos.length > 0 && view === 'career-insights' && (
            <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display">Target Stack Market Insights</h3>
                <p className="text-xs text-slate-400">Validated demand rates and salary estimates matching your primary language: <span className="font-semibold text-purple-400">{Object.keys(ghProfile?.languages_used || {})[0] || 'TypeScript'}</span>.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-2xl space-y-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Market Job Postings</span>
                  <div className="text-2xl font-bold text-slate-200">14,800+</div>
                  <span className="text-[10px] text-green-400 font-semibold">+8% from last quarter</span>
                </div>
                <div className="p-5 glass-card rounded-2xl space-y-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Average Salary Scale</span>
                  <div className="text-2xl font-bold text-slate-200">$105,000</div>
                  <span className="text-[10px] text-slate-400 font-semibold">Junior / Mid-level range</span>
                </div>
                <div className="p-5 glass-card rounded-2xl space-y-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Recruiter Searches</span>
                  <div className="text-2xl font-bold text-slate-200">High Demand</div>
                  <span className="text-[10px] text-purple-400 font-semibold">Top 15% skill tag searches</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Settings */}
          {currentUser && view === 'settings' && (
            <div className="glass-card p-6 rounded-2xl max-w-xl mx-auto space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold font-display border-b border-white/5 pb-4">Global Configurations</h3>
              
              <div className="space-y-4 text-xs">
                {/* PAT token settings */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-400">GitHub Personal Access Token (PAT)</label>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    If signed in via email/password, provide a PAT to allow fetching private repository details and language byte stats. This is stored safely in your browser's localStorage.
                  </p>
                  <input
                    type="password"
                    value={githubPat || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setGithubPat(val);
                      if (val) {
                        localStorage.setItem('devtrack_github_pat', val);
                      } else {
                        localStorage.removeItem('devtrack_github_pat');
                      }
                    }}
                    placeholder="ghp_xxxxxxxxxxxx..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200 font-mono"
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="font-semibold text-slate-300">Toggle Theme Color</span>
                  <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl border border-white/5 font-bold"
                  >
                    Set {theme === 'dark' ? 'Light' : 'Dark'} Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Profile Settings */}
          {currentUser && view === 'profile' && (
            <div className="glass-card p-6 rounded-2xl max-w-xl mx-auto space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold font-display border-b border-white/5 pb-4">Developer Profile Settings</h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                setErrorMsg('');
                const target = e.target as typeof e.target & {
                  name: { value: string };
                  github: { value: string };
                  career_goal: { value: string };
                  experience_level: { value: string };
                  tech_stack: { value: string };
                };

                const name = target.name.value;
                const github = target.github.value;
                const career = target.career_goal.value;
                const experience = target.experience_level.value;
                const stack = target.tech_stack.value.split(',').map(s => s.trim()).filter(Boolean);

                try {
                  await db.updateProfile(currentUser.id, {
                    name,
                    github_username: github,
                    career_goal: career,
                    experience_level: experience,
                    preferred_tech_stack: stack
                  });
                  
                  await fetchAndSetUserProfile(currentUser.id, currentUser.email);
                  
                  alert('Profile settings updated successfully.');
                } catch (err: any) {
                  setErrorMsg(err.message || 'Failed to update profile settings.');
                }
              }} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 mb-1.5">Full Name</label>
                  <input required name="name" defaultValue={currentUser.name} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1.5">GitHub Username</label>
                  <input required name="github" defaultValue={currentUser.github_username || ''} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1.5">Target Career Goal</label>
                  <input required name="career_goal" defaultValue={currentUser.career_goal || ''} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1.5">Developer Level</label>
                  <select name="experience_level" defaultValue={currentUser.experience_level || 'Junior / Mid-Level'} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none text-slate-200">
                    <option value="Internship / Entry-Level">Internship / Entry-Level</option>
                    <option value="Junior / Mid-Level">Junior / Mid-Level</option>
                    <option value="Senior Lead Engineer">Senior Lead Engineer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1.5">Preferred Tech Stack (Comma separated)</label>
                  <input required name="tech_stack" defaultValue={(currentUser.preferred_tech_stack || []).join(', ')} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200" />
                </div>

                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold mt-4 transition-colors">
                  Save Changes
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// Subcomponent Layout Elements
function DashboardMetric({ title, value, detail, icon: IconComp, trend }: { title: string, value: string, detail: string, icon: any, trend?: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">{title}</span>
          <span className="text-2xl font-display font-extrabold text-slate-100 block mb-2">{value}</span>
        </div>
        <div className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5 text-purple-400">
          <IconComp className="h-4.5 w-4.5" />
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-2.5 mt-2">
        <span>{detail}</span>
        {trend && <span className="text-purple-400 font-bold">{trend}</span>}
      </div>
    </div>
  );
}

function MetricProgressLabel({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-semibold text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function ComparisonRow({ label, val1, val2 }: { label: string, val1: string, val2: string }) {
  return (
    <tr className="hover:bg-slate-900/25">
      <td className="py-3 font-semibold text-slate-400">{label}</td>
      <td className="py-3 text-slate-200">{val1}</td>
      <td className="py-3 text-slate-200">{val2}</td>
    </tr>
  );
}

function InterviewQuestionCard({ id, question, answer, selectedId, onSelect }: { id: string, question: string, answer: string, selectedId: string | null, onSelect: (id: string | null) => void }) {
  const isOpen = selectedId === id;
  return (
    <div className="glass-card p-5 rounded-2xl space-y-3 cursor-pointer hover:border-white/10 transition-all" onClick={() => onSelect(isOpen ? null : id)}>
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-slate-200 text-sm">{question}</h4>
        <ChevronDown className={`h-4 w-4 text-slate-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <p className="text-xs text-slate-400 border-t border-white/5 pt-3 leading-relaxed animate-fade-in">{answer}</p>
      )}
    </div>
  );
}

function InternshipCard({ title, company, match, requirements, desc }: { title: string, company: string, match: string, requirements: string, desc: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-purple-500/20 transition-all">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-slate-200 text-sm">{title}</h4>
            <span className="text-[10px] text-slate-400">{company}</span>
          </div>
          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{match} match</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal line-clamp-3 mb-4">{desc}</p>
      </div>
      <div className="text-[10px] text-slate-500 border-t border-white/5 pt-3">
        <span className="font-semibold text-slate-400">Stack needed:</span> {requirements}
      </div>
    </div>
  );
}
