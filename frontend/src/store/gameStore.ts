import { create } from 'zustand';
import { getLastActiveAvatarId } from '@/data/avatars';

export interface Article {
  id: string;
  headline: string;
  summary: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  readTime: string;
  source: string;
  publishedAt: string;
  fullContent: string;
  quiz: { id: string; question: string; options: string[]; correct: number; explanation: string }[];
  prediction?: { id: string; question: string; options: string[]; deadline: string; resolvedAnswer?: number; xpReward: number };
}

export interface NewsApiEnrichedArticle {
  article: Omit<Article, 'quiz' | 'prediction'>;
  content: {
    quiz: { id: string; question: string; options: string[]; correct: number; explanation: string }[];
    prediction: { id: string; question: string; options: string[]; deadline: string; xpReward: number };
  };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'read' | 'quiz' | 'predict' | 'category' | 'upsc';
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  unlockCondition: string;
}

export interface LeaderboardUser {
  id: string;
  username: string;
  level: number;
  totalXP: number;
  accuracy: number;
  streak: number;
  avatar: string;
}

export interface UserState {
  id: string;
  username: string;
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  streakCount: number;
  longestStreak: number;
  lastActiveDate: string;
  badges: Badge[];
  predictionsTotal: number;
  predictionsCorrect: number;
  quizzesTotal: number;
  quizzesCorrect: number;
  articlesRead: number;
  savedArticles: string[];
  onboarded: boolean;
  avatarId: number;
  avatarBody: string;
  focusMode: 'news' | 'upsc' | 'both';
  dailyTarget: number;
}

interface GameStore {
  user: UserState;
  feed: { articles: Article[]; loading: boolean; loaded: boolean; filter: string; mode: 'news' | 'upsc' };
  quests: { daily: Quest[]; weeklyBonus: Quest | null; lastReset: string };
  leaderboard: { global: LeaderboardUser[]; weekly: LeaderboardUser[] };
  ui: { showLevelUpModal: boolean; xpFloats: { id: string; amount: number; color: string; x: number; y: number }[] };
  addXP: (amount: number, color?: string, x?: number, y?: number) => void;
  completeQuest: (questId: string) => void;
  setMode: (mode: 'news' | 'upsc') => void;
  setOnboarded: (v: boolean) => void;
  setUsername: (name: string) => void;
  setFocusMode: (mode: 'news' | 'upsc' | 'both') => void;
  setDailyTarget: (t: number) => void;
  setFeedArticles: (articles: Article[]) => void;
  hydrateArticleContent: (articleId: string, content: Pick<Article, 'quiz' | 'prediction'>) => void;
  loadLiveFeed: () => Promise<void>;
  incrementArticlesRead: () => void;
  incrementQuizzes: (correct: boolean) => void;
  incrementPredictions: (correct: boolean) => void;
  dismissLevelUp: () => void;
  updateQuestProgress: (type: string) => void;
}

const LEVEL_XP = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, 5800, 7000, 8500, 10000, 12000, 14500, 17500, 21000, 25000, 30000];
function getLevelForXP(xp: number) {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) level = i + 1; else break;
  }
  const nextLevelXP = LEVEL_XP[level] || LEVEL_XP[level - 1] + 5000;
  const currentLevelXP = LEVEL_XP[level - 1] || 0;
  return { level, xpToNextLevel: nextLevelXP - currentLevelXP, xpInLevel: xp - currentLevelXP };
}

const feedCategories = ['Technology', 'Environment', 'Economy', 'Science', 'Polity'] as const;

const mergeArticlesById = (base: Article[], updates: Article[]) => {
  const updatesById = new Map(updates.map(article => [article.id, article] as const));

  return base.map(article => {
    const updated = updatesById.get(article.id);
    return updated ? { ...article, ...updated } : article;
  });
};

const mergeUniqueArticles = (base: Article[], additions: Article[]) => {
  const seen = new Set(base.map(article => article.id));
  const merged = [...base];

  for (const article of additions) {
    if (seen.has(article.id)) continue;
    seen.add(article.id);
    merged.push(article);
  }

  return merged;
};

const sortArticlesForFeed = (articles: Article[]) => {
  const categoryRank = new Map(feedCategories.map((category, index) => [category, index] as const));
  return [...articles].sort((a, b) => {
    const aRank = categoryRank.get(a.category as typeof feedCategories[number]) ?? feedCategories.length;
    const bRank = categoryRank.get(b.category as typeof feedCategories[number]) ?? feedCategories.length;
    if (aRank !== bRank) return aRank - bRank;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
};

const mockQuests: Quest[] = [
  { id: 'dq1', title: 'Knowledge Seeker', description: 'Read 3 articles today', type: 'read', target: 3, progress: 1, xpReward: 50, completed: false },
  { id: 'dq2', title: 'Quiz Master', description: 'Complete 2 quizzes', type: 'quiz', target: 2, progress: 2, xpReward: 75, completed: true },
  { id: 'dq3', title: 'Oracle\'s Gambit', description: 'Make 1 prediction', type: 'predict', target: 1, progress: 0, xpReward: 40, completed: false },
  { id: 'dq4', title: 'Explorer', description: 'Read articles from 3 different categories', type: 'category', target: 3, progress: 2, xpReward: 60, completed: false },
  { id: 'dq5', title: 'UPSC Warrior', description: 'Answer 5 UPSC questions', type: 'upsc', target: 5, progress: 3, xpReward: 80, completed: false },
];

const mockBadges: Badge[] = [
  { id: 'b1', name: 'First Steps', description: 'Read your first article', icon: '📖', earned: true, unlockCondition: 'Read 1 article' },
  { id: 'b2', name: 'Quiz Initiate', description: 'Complete your first quiz', icon: '🧠', earned: true, unlockCondition: 'Complete 1 quiz' },
  { id: 'b3', name: 'Oracle Apprentice', description: 'Make your first prediction', icon: '🔮', earned: true, unlockCondition: 'Make 1 prediction' },
  { id: 'b4', name: 'Streak Starter', description: 'Maintain a 3-day streak', icon: '🔥', earned: true, unlockCondition: '3-day streak' },
  { id: 'b5', name: 'Bookworm', description: 'Read 10 articles', icon: '📚', earned: true, unlockCondition: 'Read 10 articles' },
  { id: 'b6', name: 'Sharp Mind', description: '80%+ quiz accuracy over 10 quizzes', icon: '⚡', earned: true, unlockCondition: '80%+ accuracy (10+ quizzes)' },
  { id: 'b7', name: 'Seer', description: '3 correct predictions', icon: '👁', earned: true, unlockCondition: '3 correct predictions' },
  { id: 'b8', name: 'Night Owl', description: 'Read after midnight', icon: '🦉', earned: true, unlockCondition: 'Read between 12-5 AM' },
  { id: 'b9', name: 'Flame Keeper', description: '7-day streak', icon: '🔥', earned: false, unlockCondition: '7-day streak' },
  { id: 'b10', name: 'Century', description: 'Read 100 articles', icon: '💯', earned: false, unlockCondition: 'Read 100 articles' },
  { id: 'b11', name: 'Grandmaster', description: 'Reach Level 20', icon: '👑', earned: false, unlockCondition: 'Reach Level 20' },
  { id: 'b12', name: 'Oracle Supreme', description: '70%+ prediction accuracy over 50', icon: '🌟', earned: false, unlockCondition: '70%+ accuracy (50+ predictions)' },
  { id: 'b13', name: 'Polymath', description: 'Read from all 6 categories', icon: '🎓', earned: false, unlockCondition: 'Read from all categories' },
  { id: 'b14', name: 'Speed Demon', description: 'Complete 5 quizzes in one day', icon: '💨', earned: false, unlockCondition: '5 quizzes in one day' },
  { id: 'b15', name: 'Unstoppable', description: '30-day streak', icon: '🏔', earned: false, unlockCondition: '30-day streak' },
  { id: 'b16', name: 'Architect', description: '100 predictions made', icon: '🏗', earned: false, unlockCondition: 'Make 100 predictions' },
  { id: 'b17', name: 'Phantom', description: '500 quizzes completed', icon: '👻', earned: false, unlockCondition: 'Complete 500 quizzes' },
  { id: 'b18', name: 'Visionary', description: '90%+ accuracy on Hard articles', icon: '🔭', earned: false, unlockCondition: '90%+ accuracy on Hard quizzes' },
  { id: 'b19', name: 'Marathon', description: 'Read for 7 consecutive days', icon: '🏃', earned: false, unlockCondition: '7 consecutive days reading' },
  { id: 'b20', name: 'Legendary', description: 'Reach Level 50', icon: '⭐', earned: false, unlockCondition: 'Reach Level 50' },
];

const mockLeaderboard: LeaderboardUser[] = [
  { id: 'l1', username: 'cyber_sage', level: 24, totalXP: 18500, accuracy: 92, streak: 45, avatar: '🧙' },
  { id: 'l2', username: 'neural_monk', level: 22, totalXP: 16200, accuracy: 88, streak: 38, avatar: '🧘' },
  { id: 'l3', username: 'data_phoenix', level: 20, totalXP: 14800, accuracy: 85, streak: 52, avatar: '🔥' },
  { id: 'l4', username: 'quantum_wolf', level: 19, totalXP: 13500, accuracy: 79, streak: 28, avatar: '🐺' },
  { id: 'l5', username: 'shreya_k', level: 18, totalXP: 12200, accuracy: 91, streak: 33, avatar: '⚡' },
  { id: 'l6', username: 'arjun_v', level: 17, totalXP: 11000, accuracy: 82, streak: 21, avatar: '🎯' },
  { id: 'l7', username: 'priya_codes', level: 16, totalXP: 9800, accuracy: 87, streak: 15, avatar: '💻' },
  { id: 'l9', username: 'zen_hacker', level: 14, totalXP: 7200, accuracy: 76, streak: 12, avatar: '🥷' },
  { id: 'l10', username: 'nova_star', level: 13, totalXP: 6100, accuracy: 83, streak: 9, avatar: '🌟' },
  { id: 'l11', username: 'mind_forge', level: 12, totalXP: 5200, accuracy: 74, streak: 7, avatar: '🔨' },
  { id: 'l12', username: 'eco_ranger', level: 11, totalXP: 4500, accuracy: 80, streak: 14, avatar: '🌿' },
  { id: 'l13', username: 'byte_rider', level: 10, totalXP: 3800, accuracy: 71, streak: 5, avatar: '🏍' },
  { id: 'l14', username: 'atlas_mind', level: 9, totalXP: 3200, accuracy: 69, streak: 3, avatar: '🗺' },
  { id: 'l15', username: 'spark_nova', level: 8, totalXP: 2600, accuracy: 65, streak: 2, avatar: '✨' },
];

export const useGameStore = create<GameStore>((set, get) => ({
  user: {
    id: 'player1',
    username: 'Player',
    currentLevel: 15,
    totalXP: 8450,
    xpToNextLevel: 1550,
    streakCount: 12,
    longestStreak: 18,
    lastActiveDate: new Date().toISOString(),
    badges: mockBadges,
    predictionsTotal: 24,
    predictionsCorrect: 17,
    quizzesTotal: 48,
    quizzesCorrect: 39,
    articlesRead: 67,
    savedArticles: [],
    onboarded: false,
    avatarId: getLastActiveAvatarId() ?? 0,
    avatarBody: 'scout',
    focusMode: 'both',
    dailyTarget: 3,
  },
  feed: { articles: [], loading: false, loaded: false, filter: 'all', mode: 'news' },
  quests: { daily: mockQuests, weeklyBonus: { id: 'wq1', title: 'Weekly Oracle', description: '70%+ prediction accuracy this week', type: 'predict', target: 70, progress: 71, xpReward: 200, completed: true }, lastReset: new Date().toISOString() },
  leaderboard: { global: mockLeaderboard, weekly: mockLeaderboard.slice(0, 10) },
  ui: { showLevelUpModal: false, xpFloats: [] },

  addXP: (amount, color = 'cyan', x = window.innerWidth / 2, y = window.innerHeight / 2) => {
    const state = get();
    const newTotalXP = state.user.totalXP + amount;
    const { level, xpToNextLevel } = getLevelForXP(newTotalXP);
    const leveledUp = level > state.user.currentLevel;
    const floatId = `xp-${Date.now()}-${Math.random()}`;
    set({
      user: { ...state.user, totalXP: newTotalXP, currentLevel: level, xpToNextLevel },
      ui: { ...state.ui, showLevelUpModal: leveledUp, xpFloats: [...state.ui.xpFloats, { id: floatId, amount, color, x, y }] },
    });
    setTimeout(() => {
      set(s => ({ ui: { ...s.ui, xpFloats: s.ui.xpFloats.filter(f => f.id !== floatId) } }));
    }, 1500);
  },
  completeQuest: (questId) => set(s => ({
    quests: { ...s.quests, daily: s.quests.daily.map(q => q.id === questId ? { ...q, completed: true, progress: q.target } : q) },
  })),
  setMode: (mode) => set(s => ({ feed: { ...s.feed, mode } })),
  setOnboarded: (v) => set(s => ({ user: { ...s.user, onboarded: v } })),
  setUsername: (name) => set(s => ({ user: { ...s.user, username: name } })),
  setFocusMode: (mode) => set(s => ({ user: { ...s.user, focusMode: mode } })),
  setDailyTarget: (t) => set(s => ({ user: { ...s.user, dailyTarget: t } })),
  setFeedArticles: (articles) => set(s => ({ feed: { ...s.feed, articles, loading: false, loaded: true } })),
  hydrateArticleContent: (articleId, content) => set(s => ({
    feed: {
      ...s.feed,
      articles: s.feed.articles.map(article => article.id === articleId ? { ...article, ...content } : article),
    },
  })),
  loadLiveFeed: async () => {
    const state = get();
    if (state.feed.loading || state.feed.loaded) return;

    set(s => ({ feed: { ...s.feed, loading: true } }));

    try {
      const { fetchLiveNewsByCategory, fetchRawNews } = await import('@/lib/newsApi');

      const rawTasks = feedCategories.map(async (category) => {
        try {
          const articles = (await fetchRawNews(category)).slice(0, 8);
          if (!articles.length) return;

          set(s => {
            const nextArticles = sortArticlesForFeed(mergeUniqueArticles(s.feed.articles, articles)).slice(0, 40);
            return {
              feed: {
                ...s.feed,
                articles: nextArticles,
                loading: false,
                loaded: true,
              },
            };
          });
        } catch {
          // Leave the feed intact if one category is temporarily unavailable.
        }
      });

      void Promise.allSettled(
        feedCategories.map(async (category) => {
          try {
            const enrichedArticles = (await fetchLiveNewsByCategory(category, 8)).slice(0, 8);
            if (!enrichedArticles.length) return;

            set(s => {
              const merged = mergeUniqueArticles(mergeArticlesById(s.feed.articles, enrichedArticles), enrichedArticles);
              const nextArticles = sortArticlesForFeed(merged).slice(0, 40);
              return {
                feed: {
                  ...s.feed,
                  articles: nextArticles,
                },
              };
            });
          } catch {
            // Enrichment is best-effort; raw articles already rendered.
          }
        })
      );

      await Promise.allSettled(rawTasks);
      set(s => ({
        feed: {
          ...s.feed,
          loading: false,
          loaded: true,
          articles: sortArticlesForFeed(s.feed.articles).slice(0, 40),
        },
      }));
    } catch (_error) {
      set(s => ({ feed: { ...s.feed, articles: [], loading: false, loaded: true } }));
    }
  },
  incrementArticlesRead: () => set(s => ({ user: { ...s.user, articlesRead: s.user.articlesRead + 1 } })),
  incrementQuizzes: (correct) => set(s => ({
    user: { ...s.user, quizzesTotal: s.user.quizzesTotal + 1, quizzesCorrect: s.user.quizzesCorrect + (correct ? 1 : 0) },
  })),
  incrementPredictions: (correct) => set(s => ({
    user: { ...s.user, predictionsTotal: s.user.predictionsTotal + 1, predictionsCorrect: s.user.predictionsCorrect + (correct ? 1 : 0) },
  })),
  dismissLevelUp: () => set(s => ({ ui: { ...s.ui, showLevelUpModal: false } })),
  updateQuestProgress: (type) => set(s => ({
    quests: { ...s.quests, daily: s.quests.daily.map(q => q.type === type && !q.completed ? { ...q, progress: Math.min(q.progress + 1, q.target), completed: q.progress + 1 >= q.target } : q) },
  })),
}));
