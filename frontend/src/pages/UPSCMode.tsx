import { useGameStore } from '@/store/gameStore';
import { HUDBar } from '@/components/game/HUDBar';
import { GlassCard } from '@/components/game/GlassCard';
import { NewsCard } from '@/components/game/NewsCard';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { BookOpen, Globe, Mountain, Leaf, Landmark, FlaskConical } from 'lucide-react';

const subjects = [
  { id: 'polity', name: 'Polity', icon: Landmark, progress: 65, questions: 12 },
  { id: 'economy', name: 'Economy', icon: Globe, progress: 45, questions: 18 },
  { id: 'geography', name: 'Geography', icon: Mountain, progress: 30, questions: 15 },
  { id: 'environment', name: 'Environment', icon: Leaf, progress: 55, questions: 10 },
  { id: 'history', name: 'History', icon: BookOpen, progress: 20, questions: 20 },
  { id: 'science', name: 'Science & Tech', icon: FlaskConical, progress: 40, questions: 14 },
];

const UPSCMode = () => {
  const articles = useGameStore(s => s.feed.articles);
  const [view, setView] = useState<'hub' | string>('hub');
  const upscArticles = articles.filter(a => ['Polity', 'Economy', 'Environment', 'Science'].includes(a.category));

  return (
    <div className="min-h-screen bg-nq-void grain-overlay">
      <HUDBar />
      <div className="pt-[76px] pb-20 md:pb-8 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl font-bold text-foreground">
            <span className="text-nq-purple text-glow-purple">UPSC</span> MODE
          </h1>
          {view !== 'hub' && (
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => setView('hub')} className="px-3 py-1.5 rounded-lg font-display text-xs text-nq-text-secondary hover:text-foreground glass">
              ← SUBJECTS
            </motion.button>
          )}
        </div>

        {view === 'hub' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <GlassCard glow="purple" className="cursor-pointer" onClick={() => setView(s.id)}>
                  <s.icon className="text-nq-purple mb-3" size={28} />
                  <h3 className="font-display text-sm font-bold text-foreground mb-2">{s.name}</h3>
                  {/* Progress ring simulation */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 rounded-full bg-nq-elevated overflow-hidden">
                      <div className="h-full rounded-full bg-nq-purple" style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-nq-text-muted">{s.progress}%</span>
                  </div>
                  <p className="text-[10px] text-nq-text-muted">{s.questions} questions</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <GlassCard hover={false} className="border-nq-purple/20">
              <h3 className="font-display text-sm font-bold text-nq-purple mb-2">DAILY UPSC CHALLENGE</h3>
              <p className="text-xs text-nq-text-secondary">3 MCQs refreshed daily • Earns purple XP • Own streak counter</p>
            </GlassCard>
            {upscArticles.map((a, i) => (
              <NewsCard key={a.id} article={a} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UPSCMode;
