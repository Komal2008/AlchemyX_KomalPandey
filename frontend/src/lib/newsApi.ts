import type { Article } from '@/store/gameStore';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:3001';

type RawNewsArticleResponse = {
  id: string;
  headline: string;
  summary: string;
  fullContent: string;
  category: string;
  source: string;
  publishedAt: string;
  readTime: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  quiz: [];
  prediction: null;
};

export interface EnrichedNewsArticleResponse {
  article: Omit<Article, 'quiz' | 'prediction'>;
  content: {
    quiz: { id: string; question: string; options: string[]; correct: number; explanation: string }[];
    prediction: { id: string; question: string; options: string[]; deadline: string; xpReward: number };
  };
}

type EnrichedNewsResponse = {
  success: boolean;
  count: number;
  articles: EnrichedNewsArticleResponse[];
};

type RawNewsResponse = {
  success: boolean;
  articles: RawNewsArticleResponse[];
};

const categoryMap: Record<string, string> = {
  Technology: 'technology',
  Environment: 'environment',
  Economy: 'business',
  Science: 'science',
  Polity: 'politics',
  Culture: 'entertainment',
  Sports: 'sports',
  World: 'world',
  General: 'top',
};

export const toNewsApiCategory = (category?: string) => {
  if (!category) return undefined;
  return categoryMap[category] ?? category.toLowerCase();
};

export const toArticle = (entry: EnrichedNewsArticleResponse): Article => ({
  ...entry.article,
  quiz: entry.content.quiz,
  prediction: entry.content.prediction,
});

export const toRawArticle = (entry: RawNewsArticleResponse): Article => ({
  ...entry,
  quiz: [],
});

export const fetchRawNews = async (category?: string): Promise<Article[]> => {
  const query = new URLSearchParams({ country: 'in', language: 'en' });
  const apiCategory = toNewsApiCategory(category);
  if (apiCategory) {
    query.set('category', apiCategory);
  }

  const response = await fetch(`${API_BASE_URL}/api/news?${query.toString()}`);
  const data = await response.json() as RawNewsResponse;

  if (!response.ok || !data.success) {
    throw new Error('Failed to load live news.');
  }

  return (data.articles ?? []).map(toRawArticle);
};

export const fetchLiveNews = async (count = 40): Promise<Article[]> => {
  const response = await fetch(`${API_BASE_URL}/api/news/enriched?count=${count}&country=in&language=en&mode=ai`);
  const data = await response.json() as EnrichedNewsResponse;

  if (!response.ok || !data.success) {
    throw new Error('Failed to load live news.');
  }

  return (data.articles ?? []).map(toArticle);
};

export const fetchLiveNewsByCategory = async (category: string, count = 8): Promise<Article[]> => {
  const query = new URLSearchParams({ count: String(count), country: 'in', language: 'en', mode: 'ai' });
  const apiCategory = toNewsApiCategory(category);
  if (apiCategory) {
    query.set('category', apiCategory);
  }

  const response = await fetch(`${API_BASE_URL}/api/news/enriched?${query.toString()}`);
  const data = await response.json() as EnrichedNewsResponse;

  if (!response.ok || !data.success) {
    throw new Error('Failed to load live news.');
  }

  return (data.articles ?? []).map(toArticle);
};

export const generateArticleGameplay = async (article: Article) => {
  const response = await fetch(`${API_BASE_URL}/api/news/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      headline: article.headline,
      summary: article.summary,
      fullContent: article.fullContent,
      category: article.category,
      source: article.source,
      publishedAt: article.publishedAt,
    }),
  });

  const data = await response.json() as {
    success: boolean;
    quiz: Article['quiz'];
    prediction: NonNullable<Article['prediction']>;
    error?: string;
  };

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate gameplay content.');
  }

  return data;
};
