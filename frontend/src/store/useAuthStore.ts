import { create } from 'zustand';
import { setStoredAvatarId } from '@/data/avatars';

export interface UserData {
  id: string;
  username: string;
  email: string;
  joinDate: string;
  avatarId: number;
  avatarCustomization: { skinTone: number; trailColor: string };
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  streakCount: number;
  lastActiveDate: string | null;
  interests: string[];
  dailyGoal: number;
  mode: string;
  badges: string[];
  articlesRead: number;
  quizzesTotal: number;
  quizzesCorrect: number;
  predictionsTotal: number;
  predictionsCorrect: number;
  battleRating: number;
  battleTier: string;
  wins: number;
  losses: number;
  draws: number;
  recentForm: string[];
}

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  login: (user: UserData) => void;
  logout: () => void;
  updateUser: (data: Partial<UserData>) => void;
}

const stored = localStorage.getItem('newsquest_user');
const initialUser = stored ? JSON.parse(stored) : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  login: (user) => {
    localStorage.setItem('newsquest_user', JSON.stringify(user));
    setStoredAvatarId(user.avatarId);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('newsquest_user');
    set({ user: null, isAuthenticated: false });
  },
  updateUser: (data) =>
    set((state) => {
      const updated = state.user ? { ...state.user, ...data } : null;
      if (updated) {
        localStorage.setItem('newsquest_user', JSON.stringify(updated));
        if (typeof data.avatarId === 'number') {
          setStoredAvatarId(data.avatarId);
        }
      }
      return { user: updated };
    }),
}));
