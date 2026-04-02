import { useGameStore } from '@/store/gameStore';
import { HUDBar } from '@/components/game/HUDBar';
import { QuestCard } from '@/components/game/QuestCard';
import { GlassCard } from '@/components/game/GlassCard';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Target, Gift } from 'lucide-react';

const QuestsPage = () => {
  const { daily, weeklyBonus } = useGameStore(s => s.quests);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const completed = daily.filter(q => q.completed).length;

  return (
    <div className="min-h-screen bg-nq-void grain-overlay">
      <HUDBar />
      <div className="pt-[76px] pb-20 md:pb-8 max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2"><Target size={20} className="text-nq-cyan" /> DAILY MISSION BRIEF</h1>
            <p className="text-xs text-nq-text-muted mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-nq-text-muted">RESETS IN</p>
            <p className="font-mono text-lg font-bold text-nq-cyan text-glow-cyan">{countdown}</p>
          </div>
        </div>

        {/* Progress overview */}
        <GlassCard hover={false} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-xs text-nq-text-secondary">{completed}/{daily.length} QUESTS COMPLETE</span>
            <span className="font-mono text-xs text-nq-cyan">{Math.round((completed / daily.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-nq-elevated overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-nq-cyan to-nq-green"
              animate={{ width: `${Math.max(5, (completed / daily.length) * 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </GlassCard>

        {/* Quest cards */}
        <div className="space-y-3 mb-6">
          {daily.map((quest, i) => (
            <QuestCard key={quest.id} quest={quest} index={i} />
          ))}
        </div>

        {/* Weekly bonus */}
        {weeklyBonus && (
          <GlassCard hover={false} className="border-nq-purple/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-nq-purple/20 text-nq-purple flex items-center justify-center">
                <Gift size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-display text-xs font-bold text-nq-purple">WEEKLY BONUS — {weeklyBonus.title.toUpperCase()}</h4>
                  <span className="font-display text-xs font-bold text-nq-purple">+{weeklyBonus.xpReward} XP</span>
                </div>
                <p className="text-xs text-nq-text-secondary">{weeklyBonus.description}</p>
                {weeklyBonus.completed && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-nq-green/20 text-nq-green">COMPLETED ✓</span>
                )}
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default QuestsPage;
