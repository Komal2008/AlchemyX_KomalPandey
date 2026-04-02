import { useParams, Link } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { generateArticleGameplay } from '@/lib/newsApi';
import { buildFastGameplay } from '@/lib/articleGameplay';
import { GlassCard } from '@/components/game/GlassCard';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';

const confidenceLabel = (v: number) => v <= 30 ? 'Just a guess' : v <= 60 ? 'Moderate' : v <= 85 ? 'High' : 'ALL IN 🔥';

const PredictionView = () => {
  const { id } = useParams();
  const article = useGameStore(s => s.feed.articles.find(a => a.id === id));
  const feedLoaded = useGameStore(s => s.feed.loaded);
  const { addXP, incrementPredictions, updateQuestProgress, hydrateArticleContent } = useGameStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [locked, setLocked] = useState(false);
  const [loadingGameplay, setLoadingGameplay] = useState(false);

  useEffect(() => {
    if (!article || article.prediction || loadingGameplay) return;

    let cancelled = false;
    setLoadingGameplay(true);
    hydrateArticleContent(article.id, buildFastGameplay(article));
    generateArticleGameplay(article)
      .then((content) => {
        if (!cancelled) hydrateArticleContent(article.id, content);
      })
      .finally(() => {
        if (!cancelled) setLoadingGameplay(false);
      });

    return () => {
      cancelled = true;
    };
  }, [article, loadingGameplay, hydrateArticleContent]);

  if (!article) return <div className="min-h-screen bg-nq-void flex items-center justify-center text-foreground">{feedLoaded ? 'No prediction available' : 'Loading article...'}</div>;
  const fallback = !article.prediction ? buildFastGameplay(article) : null;
  const prediction = article.prediction ?? fallback?.prediction ?? null;
  if (!prediction) return <div className="min-h-screen bg-nq-void flex items-center justify-center text-foreground">Generating prediction...</div>;

  const pred = prediction;
  const xpPreview = Math.round((confidence / 100) * pred.xpReward);

  const handleLock = () => {
    if (selected === null) return;
    setLocked(true);
    addXP(xpPreview, 'orange');
    incrementPredictions(false);
    updateQuestProgress('predict');
  };

  return (
    <div className="min-h-screen grain-overlay flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, hsl(240 33% 5%), hsl(25 100% 8%))' }}>
      <div className="max-w-[640px] w-full">
        <div className="flex items-center justify-between mb-6">
          <Link to={`/article/${article.id}`} className="text-nq-text-secondary hover:text-foreground"><ArrowLeft size={20} /></Link>
          <span className="font-display text-sm font-bold text-nq-orange text-glow-orange">THE ORACLE CHALLENGE</span>
          <div />
        </div>

        <GlassCard hover={false} className="py-6 border-nq-orange/20">
          <p className="text-xs text-nq-text-muted mb-3 uppercase">Based on: {article.headline}</p>
          <h2 className="font-display text-lg font-bold text-foreground mb-6">{pred.question}</h2>

          {!locked ? (
            <>
              <div className="space-y-3 mb-6">
                {pred.options.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelected(i)}
                    className={`w-full text-left px-4 py-3 rounded-lg glass border-2 transition-all ${selected === i ? 'border-nq-orange bg-nq-orange/10 glow-orange' : 'border-border/30 hover:border-nq-orange/30'}`}
                  >
                    <span className="text-sm text-foreground">{opt}</span>
                  </motion.button>
                ))}
              </div>

              {/* Confidence slider */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-display text-xs text-nq-text-secondary">CONFIDENCE</span>
                  <span className="font-mono text-sm text-nq-orange font-bold">{confidence}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={confidence}
                  onChange={e => setConfidence(Number(e.target.value))}
                  className="w-full accent-[#FF6B00]"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-nq-text-muted">{confidenceLabel(confidence)}</span>
                  <span className="font-display text-xs text-nq-orange">+{xpPreview} XP</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleLock}
                disabled={selected === null}
                className="w-full py-3 rounded-lg font-display font-bold bg-nq-orange/20 text-nq-orange border border-nq-orange/30 hover:bg-nq-orange/30 hover:glow-orange transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <Lock size={16} /> LOCK IN PREDICTION
              </motion.button>
            </>
          ) : (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
              <div className="font-display text-4xl font-black text-nq-orange text-glow-orange mb-3">LOCKED IN 🔥</div>
              <p className="text-sm text-nq-text-secondary mb-2">Your prediction: <span className="text-foreground">{pred.options[selected!]}</span></p>
              <p className="text-sm text-nq-text-secondary mb-4">Confidence: <span className="font-mono text-nq-orange">{confidence}%</span></p>
              <span className="px-3 py-1 rounded-full text-xs font-display font-bold bg-nq-orange/20 text-nq-orange border border-nq-orange/30">PENDING</span>
              <div className="mt-6 flex gap-3 justify-center">
                <Link to="/home">
                  <motion.button whileTap={{ scale: 0.94 }} className="px-4 py-2 rounded-lg font-display text-xs font-bold bg-nq-cyan/20 text-nq-cyan border border-nq-cyan/30">BACK TO FEED</motion.button>
                </Link>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default PredictionView;
