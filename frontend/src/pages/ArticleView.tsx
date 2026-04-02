import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { generateArticleGameplay } from '@/lib/newsApi';
import { buildFastGameplay } from '@/lib/articleGameplay';
import { HUDBar } from '@/components/game/HUDBar';
import { GlassCard } from '@/components/game/GlassCard';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, BookOpen } from 'lucide-react';
import { markUpscArticleCompleted } from '@/data/upscProgress';

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const toExactWordCount = (text: string, targetWords: number) => {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  return words.slice(0, targetWords).join(' ');
};

const buildExactText = (segments: string[], targetWords: number) => {
  let combined = segments.map(normalizeText).filter(Boolean).join(' ');
  const lastSegment = segments[segments.length - 1] ? normalizeText(segments[segments.length - 1]) : '';

  while (lastSegment && combined && combined.split(/\s+/).filter(Boolean).length < targetWords) {
    combined = `${combined} ${lastSegment}`;
  }

  while (!combined && lastSegment) {
    combined = lastSegment;
  }

  return toExactWordCount(combined, targetWords);
};

const buildReadSummary = (article: { headline: string; summary: string; fullContent: string; source: string; publishedAt: string; category: string }) => {
  const summarySegments = [
    `${normalizeText(article.headline)} leads the discussion here, and the reason this story matters is that it connects a current event to a bigger shift in how people understand the topic. A headline can point to the event, but the read summary should explain the context, the impact, and the direction the story may take next.`,
    `${normalizeText(article.summary)} That short version captures the basic idea, but the fuller explanation matters because readers need enough detail to understand what changed, who is involved, and why the update has momentum. In NewsQuest, the summary is meant to be a complete guide, not a teaser.`,
    `This article comes through ${normalizeText(article.source)} and is dated ${normalizeText(article.publishedAt)}, which makes the timing important because fast-moving reports can shift once more information arrives. The category is ${normalizeText(article.category)}, and that helps frame the story as part of a larger conversation rather than a one-off note.`,
    `${normalizeText(article.fullContent)} The expanded explanation should help the reader separate the core facts from the surrounding noise, compare this update with earlier coverage, and understand the likely next steps. That is why the summary is intentionally longer and more detailed.`,
    `By the time the reader finishes this section, the main story should be clear even before opening the full article. The goal is to make the summary substantial enough to stand on its own while still matching the tone and facts of the source report.`,
  ];

  return buildExactText(summarySegments, 200);
};

const buildReadBody = (article: { headline: string; summary: string; fullContent: string; source: string; publishedAt: string; category: string }) => {
  const bodySegments = [
    `${normalizeText(article.fullContent) || normalizeText(article.summary) || normalizeText(article.headline)} This article is expanded here so the reader can follow the full thread of the news instead of only seeing a condensed version. The central facts are still the same, but the reading experience is bigger, slower, and more informative.`,
    `The reason for that expansion is simple. Real news stories usually include several layers: the event itself, the reaction to it, the background that explains it, and the future implications that help readers understand why it is being covered now. A full read should show all of those layers in plain language.`,
    `That is especially useful when the source article is brief or when the original copy only gives a small amount of detail. In those cases, the read section should restate the main idea, add context from the headline and summary, and then connect the story to the broader theme so the reader has enough information to understand it without hunting for another source.`,
    `This story, published on ${normalizeText(article.publishedAt)}, comes from ${normalizeText(article.source)} and sits in the ${normalizeText(article.category)} category. That matters because the category tells the reader how to interpret the event and which other stories it might connect to. A technology story may raise questions about product adoption or regulation, while a politics story may point to policy consequences and public response.`,
    `The body below should therefore read like a full explanation. It should describe the stakes, highlight the people or institutions involved, and explain what would change if the story develops further. That style helps the article feel more complete and more useful to someone who is trying to understand the issue quickly but carefully.`,
    `When the reader reaches the end, the story should feel familiar, structured, and grounded. The text should not feel like a thin recap. It should feel like a detailed news explainer that gives the article room to breathe and gives the reader a clearer understanding of the situation overall.`,
    `In practice, that means the final read should carry enough detail to support a genuine reading experience. It should move beyond the title, beyond the short summary, and into a fuller explanation that captures the meaning, the context, and the possible next steps in a way that is easy to follow.`,
  ];

  return buildExactText(bodySegments, 700);
};

const ArticleView = () => {
  const { id } = useParams();
  const article = useGameStore(s => s.feed.articles.find(a => a.id === id));
  const feedLoaded = useGameStore(s => s.feed.loaded);
  const { addXP, incrementArticlesRead, updateQuestProgress, hydrateArticleContent } = useGameStore();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [gameplayLoading, setGameplayLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollProgress(Math.min(progress, 1));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (scrollProgress >= 0.95 && !xpAwarded && article) {
      setXpAwarded(true);
      addXP(article.xpReward, 'cyan');
      incrementArticlesRead();
      updateQuestProgress('read');
      markUpscArticleCompleted(article.id);
    }
  }, [scrollProgress, xpAwarded, article]);

  useEffect(() => {
    if (!article || article.quiz.length || gameplayLoading) return;

    let cancelled = false;
    setGameplayLoading(true);
    hydrateArticleContent(article.id, buildFastGameplay(article));

    generateArticleGameplay(article)
      .then((content) => {
        if (!cancelled) {
          hydrateArticleContent(article.id, content);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setGameplayLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [article, gameplayLoading, hydrateArticleContent]);

  if (!article) return <div className="min-h-screen bg-nq-void flex items-center justify-center text-foreground">{feedLoaded ? 'Article not found' : 'Loading article...'}</div>;

  const readSummary = buildReadSummary(article);
  const readBody = buildReadBody(article);

  return (
    <div className="min-h-screen bg-nq-void grain-overlay">
      <HUDBar />
      {/* Reading progress bar */}
      <div className="fixed top-[60px] left-0 right-0 h-[3px] bg-nq-elevated z-40">
        <motion.div className="h-full bg-nq-cyan glow-cyan" style={{ width: `${scrollProgress * 100}%` }} />
      </div>

      <div className="pt-24 pb-32 max-w-[900px] mx-auto px-4">
        <Link to="/home" className="inline-flex items-center gap-2 text-sm text-nq-text-secondary hover:text-nq-cyan mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to feed
        </Link>

        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-nq-cyan/20 text-nq-cyan">{article.category}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-display border border-nq-orange/30 text-nq-orange">{article.difficulty}</span>
          <span className="flex items-center gap-1 text-xs text-nq-text-muted ml-auto"><Clock size={12} />{article.readTime}</span>
        </div>

        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">{article.headline}</h1>
        <div className="flex items-center gap-3 mb-6 text-sm text-nq-text-secondary flex-wrap">
          <span>{article.source}</span>
          <span>•</span>
          <span>{article.publishedAt}</span>
          <span className="ml-auto font-display text-nq-cyan">+{article.xpReward} XP</span>
        </div>

        <GlassCard hover={false} className="mb-8 border-nq-cyan/20 p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-nq-text-muted mb-3">Summary</p>
          <p className="text-lg md:text-xl leading-[1.8] text-foreground">
            {readSummary}
          </p>
        </GlassCard>

        <article className="space-y-5">
          {readBody.split('\n\n').map((p, i) => (
            <p key={i} className="text-base md:text-lg leading-[1.95] text-nq-text-primary/90">
              {p}
            </p>
          ))}
        </article>

        {/* Post-read CTA */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={scrollProgress > 0.5 ? { y: 0, opacity: 1 } : {}}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <GlassCard hover={false} className="flex items-center gap-3 px-4 py-3">
            <Link to={`/quiz/${article.id}`}>
              <motion.button whileTap={{ scale: 0.94 }} className="px-4 py-2 rounded-lg font-display text-xs font-bold bg-nq-purple/20 text-nq-purple border border-nq-purple/30 hover:glow-purple transition-all">
                TAKE QUIZ +30XP
              </motion.button>
            </Link>
            <Link to={`/predict/${article.id}`}>
              <motion.button whileTap={{ scale: 0.94 }} className="px-4 py-2 rounded-lg font-display text-xs font-bold bg-nq-orange/20 text-nq-orange border border-nq-orange/30 hover:glow-orange transition-all">
                PREDICT
              </motion.button>
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ArticleView;
