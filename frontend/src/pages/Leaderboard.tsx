import { useGameStore } from '@/store/gameStore';
import { HUDBar } from '@/components/game/HUDBar';
import { GlassCard } from '@/components/game/GlassCard';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Trophy, Flame, Brain, Clock } from 'lucide-react';

const tabs = [
  { id: 'all', label: 'ALL TIME', icon: Trophy },
  { id: 'weekly', label: 'THIS WEEK', icon: Clock },
  { id: 'streak', label: 'STREAK KINGS', icon: Flame },
  { id: 'oracle', label: 'ORACLE MASTERS', icon: Brain },
];

const podiumColors = ['border-yellow-400/40 glow-orange', 'border-gray-400/40', 'border-amber-700/40'];
const podiumEmoji = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const [tab, setTab] = useState('all');
  const leaderboard = useGameStore(s => s.leaderboard.global);
  const user = useGameStore(s => s.user);

  const sorted = [...leaderboard].sort((a, b) => {
    if (tab === 'streak') return b.streak - a.streak;
    if (tab === 'oracle') return b.accuracy - a.accuracy;
    return b.totalXP - a.totalXP;
  });

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const userRank = sorted.findIndex(u => u.username === user.username) + 1 || 8;
  const nextUser = sorted[userRank - 2];

  return (
    <div className="min-h-screen bg-nq-void grain-overlay">
      <HUDBar />
      <div className="pt-[108px] pb-20 md:pb-8 max-w-3xl mx-auto px-4">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display font-bold whitespace-nowrap transition-all ${tab === t.id ? 'bg-nq-cyan/20 text-nq-cyan' : 'text-nq-text-muted hover:text-nq-text-secondary'}`}
            >
              <t.icon size={14} />
              {t.label}
            </motion.button>
          ))}
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 mb-16 mt-16 pt-6 h-56">
          {[1, 0, 2].map(i => {
            const u = top3[i];
            if (!u) return null;
            const height = i === 0 ? 'h-44' : i === 1 ? 'h-36' : 'h-28';
            return (
              <motion.div
                key={u.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.15, type: 'spring' }}
                className="flex flex-col items-center translate-y-10"
              >
                <span className="text-3xl mb-2">{u.avatar}</span>
                <span className="font-display text-xs font-bold text-foreground mb-1">{u.username}</span>
                <span className="font-mono text-[10px] text-nq-cyan mb-3">{tab === 'streak' ? `${u.streak}🔥` : tab === 'oracle' ? `${u.accuracy}%` : u.totalXP.toLocaleString()}</span>
                <div className={`${height} w-20 rounded-t-lg glass border-2 ${podiumColors[i]} flex items-start justify-center pt-2`}>
                  <span className="text-xl">{podiumEmoji[i]}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Table */}
        <div className="space-y-2">
          {rest.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="flex items-center gap-3 py-3 hover:border-nq-cyan/20">
                <span className="font-display text-xs font-bold text-nq-text-muted w-6 text-center">{i + 4}</span>
                <span className="text-lg">{u.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{u.username}</p>
                  <p className="text-[10px] text-nq-text-muted">Level {u.level}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-nq-cyan">{u.totalXP.toLocaleString()} XP</p>
                  <p className="font-mono text-[10px] text-nq-text-muted">{u.accuracy}% • {u.streak}🔥</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Your position */}
        <div className="fixed bottom-6 md:bottom-4 left-1/2 -translate-x-1/2 z-30">
          <GlassCard hover={false} className="px-6 py-3 border-nq-purple/30">
            <p className="font-display text-xs text-nq-text-secondary">
              #{userRank} — You need <span className="text-nq-cyan font-bold">{nextUser ? (nextUser.totalXP - user.totalXP).toLocaleString() : '0'} XP</span> to overtake <span className="text-nq-purple">@{nextUser?.username || 'nobody'}</span>
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
