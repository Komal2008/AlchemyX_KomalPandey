import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { XPFloat } from "@/components/game/XPFloat";
import { LevelUpModal } from "@/components/game/LevelUpModal";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/gameStore";
import { supabase } from "@/lib/supabase";
import { getLastActiveAvatarId } from "@/data/avatars";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomeFeed from "./pages/HomeFeed";
import ArticleView from "./pages/ArticleView";
import QuizView from "./pages/QuizView";
import PredictionView from "./pages/PredictionView";
import Dashboard from "./pages/Dashboard";
import QuestsPage from "./pages/QuestsPage";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import UPSCMode from "./pages/UPSCMode";
import AvatarEditor from "./pages/AvatarEditor";
import BattleLobby from "./pages/BattleLobby";
import BattleArena from "./pages/BattleArena";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const buildOauthUser = (authUser: SupabaseUser) => ({
  id: authUser.id,
  username:
    authUser.user_metadata?.user_name ??
    authUser.user_metadata?.full_name ??
    authUser.email?.split('@')[0] ??
    'player',
  email: authUser.email ?? '',
  joinDate: authUser.created_at ?? new Date().toISOString(),
  avatarId: getLastActiveAvatarId() ?? 0,
  avatarCustomization: { skinTone: 0, trailColor: 'cyan' },
  currentLevel: 1,
  totalXP: 25,
  xpToNextLevel: 100,
  streakCount: 0,
  lastActiveDate: new Date().toISOString(),
  interests: [],
  dailyGoal: 5,
  mode: 'both',
  badges: ['Google Sign-In'],
  articlesRead: 0,
  quizzesTotal: 0,
  quizzesCorrect: 0,
  predictionsTotal: 0,
  predictionsCorrect: 0,
  battleRating: 1000,
  battleTier: 'ROOKIE',
  wins: 0,
  losses: 0,
  draws: 0,
  recentForm: [],
});

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
};

const PublicOnly = ({ children }: { children: ReactNode }) => {
  return children;
};

const RootRedirect = () => {
  return <Navigate to="/login" replace />;
};

const FeedBootstrap = () => {
  const user = useAuthStore((s) => s.user);
  const loaded = useGameStore((s) => s.feed.loaded);
  const loadLiveFeed = useGameStore((s) => s.loadLiveFeed);

  useEffect(() => {
    if (user && !loaded) {
      void loadLiveFeed();
    }
  }, [user, loaded, loadLiveFeed]);

  return null;
};

const App = () => (
  <AppShell />
);

const AppShell = () => {
  const login = useAuthStore((s) => s.login);
  const authUser = useAuthStore((s) => s.user);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    const syncSession = (session: Session | null) => {
      if (!active) return;

      if (session?.user) {
        const oauthUser = buildOauthUser(session.user);
        if (oauthUser.id !== currentUserId) {
          login(oauthUser);
          useGameStore.setState((state) => ({
            user: {
              ...state.user,
              id: oauthUser.id,
              username: oauthUser.username,
              currentLevel: oauthUser.currentLevel,
              totalXP: oauthUser.totalXP,
              xpToNextLevel: oauthUser.xpToNextLevel,
              streakCount: oauthUser.streakCount,
              lastActiveDate: oauthUser.lastActiveDate,
              articlesRead: oauthUser.articlesRead,
              quizzesTotal: oauthUser.quizzesTotal,
              quizzesCorrect: oauthUser.quizzesCorrect,
              predictionsTotal: oauthUser.predictionsTotal,
              predictionsCorrect: oauthUser.predictionsCorrect,
              avatarId: oauthUser.avatarId,
              avatarBody: 'scout',
              focusMode: 'both',
              dailyTarget: oauthUser.dailyGoal,
              onboarded: true,
            },
          }));
        }
      }

      setAuthReady(true);
    };

    void supabase.auth.getSession().then(({ data }) => syncSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [currentUserId, login]);

  useEffect(() => {
    if (!authUser) return;

    useGameStore.setState((state) => ({
      user: {
        ...state.user,
        id: authUser.id,
        username: authUser.username,
        currentLevel: authUser.currentLevel,
        totalXP: authUser.totalXP,
        xpToNextLevel: authUser.xpToNextLevel,
        streakCount: authUser.streakCount,
        lastActiveDate: authUser.lastActiveDate ?? state.user.lastActiveDate,
        articlesRead: authUser.articlesRead,
        quizzesTotal: authUser.quizzesTotal,
        quizzesCorrect: authUser.quizzesCorrect,
        predictionsTotal: authUser.predictionsTotal,
        predictionsCorrect: authUser.predictionsCorrect,
        avatarId: authUser.avatarId ?? getLastActiveAvatarId() ?? state.user.avatarId,
        avatarBody: 'scout',
        focusMode: 'both',
        dailyTarget: authUser.dailyGoal,
        onboarded: true,
      },
    }));
  }, [authUser]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-nq-void flex items-center justify-center text-sm text-nq-text-secondary">
        Syncing Supabase session...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <XPFloat />
        <LevelUpModal />
        <FeedBootstrap />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
            <Route path="/home" element={<RequireAuth><HomeFeed /></RequireAuth>} />
            <Route path="/article/:id" element={<RequireAuth><ArticleView /></RequireAuth>} />
            <Route path="/quiz/:id" element={<RequireAuth><QuizView /></RequireAuth>} />
            <Route path="/predict/:id" element={<RequireAuth><PredictionView /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/battle" element={<RequireAuth><BattleLobby /></RequireAuth>} />
            <Route path="/battle/:id" element={<RequireAuth><BattleArena /></RequireAuth>} />
            <Route path="/quests" element={<RequireAuth><QuestsPage /></RequireAuth>} />
            <Route path="/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/upsc" element={<RequireAuth><UPSCMode /></RequireAuth>} />
            <Route path="/avatar-editor" element={<RequireAuth><AvatarEditor /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
