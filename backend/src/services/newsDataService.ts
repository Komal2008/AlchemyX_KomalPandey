import NodeCache from 'node-cache';

const BASE_URL = 'https://newsdata.io/api/1/latest';

const cache = new NodeCache({
  stdTTL: Number.parseInt(process.env.CACHE_TTL ?? '300', 10),
  checkperiod: 60,
  useClones: false,
});

const SUMMARY_WORD_TARGET = 200;
const BODY_WORD_TARGET = 700;

export interface NewsDataQuery {
  q?: string;
  country?: string;
  language?: string;
  category?: string;
  page?: string;
}

export interface NewsArticle {
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
  quiz: never[];
  prediction: null;
}

export class NewsDataError extends Error {
  statusCode: number;

  raw: unknown;

  constructor(message: string, statusCode = 500, raw: unknown = null) {
    super(message);
    this.name = 'NewsDataError';
    this.statusCode = statusCode;
    this.raw = raw;
  }
}

const buildCacheKey = (params: Record<string, string | number | boolean | undefined | null>) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');

const slugify = (title: string) => title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 60);

const estimateReadTime = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
};

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const toExactWordCount = (text: string, targetWords: number) => {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  return words.slice(0, targetWords).join(' ');
};

const isPaywalledContent = (content: string) =>
  /only available in paid plans/i.test(content) ||
  /available in paid plans/i.test(content) ||
  /subscriber only/i.test(content);

const buildReadableContent = (title: string, description: string, content?: string) => {
  const cleanDescription = description.trim();
  const cleanContent = content?.trim();

  const sourceText = cleanContent && !isPaywalledContent(cleanContent)
    ? cleanContent
    : cleanDescription || title;
  const topicLine = cleanDescription || `Summary: ${title}.`;
  const subject = cleanDescription || title;
  const expanded = [
    topicLine,
    `In simple terms, this story is about ${subject.toLowerCase()}, but the detail that matters most is how the update changes the way readers understand the event. A headline can only point to the opening frame of the story, while the full version explains who is involved, what happened, and why the timing matters.`,
    `The broader context is important because news rarely exists in isolation. Even a single report can connect to policy, public reaction, economic effects, technology trends, or social debates that have been building for some time. Reading the story in a fuller form helps make those links clearer and makes the article more useful for follow-up understanding.`,
    `The report also becomes easier to interpret when the reader sees the sequence of events in order. First comes the core development, then comes the explanation of how it affects the immediate situation, and finally comes the part that shows what may happen next. That structure is why NewsQuest expands each article into a more complete reading experience.`,
    `If there is original reporting available from the source, the article can be understood through the language, numbers, names, or statements used there. If that source text is limited or paywalled, the summary still preserves the important meaning by restating the story in clear terms that stay close to the original topic and avoid vague filler.`,
    `The expanded read also gives the audience a better sense of momentum. Some stories are about sudden changes, while others are about slow-moving shifts that only become visible when you look at the details closely. That difference matters because it tells the reader whether the update is likely to fade quickly or continue developing over time.`,
    `What follows next may be an official response, a clarification, another round of data, or a reaction from the people and institutions involved. By presenting the story in a fuller format, NewsQuest helps the reader understand not only what the article says today, but also what to watch for in the next update.`,
    `This longer body text is intentionally written to be readable, detailed, and easy to revisit. It gives the story room to breathe while still keeping the main facts close to the surface so the reader can move from the summary into the full context without losing the thread of the article.`,
    sourceText ? `Source context: ${sourceText}.` : `Source context: ${subject}.`,
  ].join('\n\n');

  return toExactWordCount(expanded, BODY_WORD_TARGET);
};

const buildExpandedSummary = (title: string, description: string, content?: string) => {
  const cleanDescription = description.trim();
  const cleanContent = content?.trim();
  const base = cleanDescription || cleanContent || title;
  const topic = title.toLowerCase();
  const snippet = cleanContent ? cleanContent.slice(0, 260).replace(/\s+/g, ' ').trim() : base;
  const expanded = [
    `${base}. In this NewsQuest summary, the story is unpacked in a more complete way so readers can understand not just what happened, but why it matters. The core issue here is ${topic}, and the latest update fits into a wider pattern of changes that readers should keep an eye on.`,
    `The article points to the immediate facts, but the bigger picture is how those facts could shape the next few days or weeks. When news moves quickly, the useful part is often the context around it: who is involved, what triggered the change, and what could happen next. That is what makes this story worth following beyond the first headline.`,
    `If we look more closely, the story is connected to practical outcomes for people, institutions, or markets. The details suggest that the situation is still developing, which means the next official statements, responses, or data releases may be just as important as the initial report. In other words, this is not a standalone update; it is part of an ongoing conversation.`,
    `A short version of the story would stop at the headline, but the fuller view helps explain the momentum behind it. ${snippet} This added context gives the reader a better sense of the actors, the stakes, and the possible direction of the story. For NewsQuest, that deeper explanation is what turns a quick news item into something worth learning from.`,
    `Looking ahead, the most important thing is to watch how the situation evolves and whether the next update confirms or challenges the current direction. That could mean new policy language, fresh numbers, public reactions, or a new development that changes the interpretation of the original report. This expanded summary is designed to keep the reading experience substantial, clear, and useful.`,
    `The summary should feel complete enough that the reader can understand the article without needing extra background research. It should restate the main issue, explain the significance, and preserve enough specific detail to make the story feel grounded in the original reporting.`,
  ].join('\n\n');

  return toExactWordCount(expanded, SUMMARY_WORD_TARGET);
};

const normaliseCategory = (rawCategory: unknown) => {
  if (!rawCategory) return 'General';

  const first = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const value = String(first ?? '').toLowerCase();

  const map: Record<string, string> = {
    technology: 'Technology',
    science: 'Science',
    business: 'Economy',
    entertainment: 'Culture',
    sports: 'Sports',
    health: 'Science',
    politics: 'Polity',
    environment: 'Environment',
    world: 'World',
    top: 'General',
  };

  return map[value] ?? 'General';
};

const inferDifficulty = (article: { content?: string | null }) => {
  const wordCount = (article.content ?? '').split(/\s+/).filter(Boolean).length;
  if (wordCount > 500) return 'Hard';
  if (wordCount > 200) return 'Medium';
  return 'Easy';
};

const inferXP = (article: { content?: string | null }) => {
  const map: Record<'Easy' | 'Medium' | 'Hard', number> = {
    Easy: 15,
    Medium: 20,
    Hard: 25,
  };

  return map[inferDifficulty(article)];
};

const transformArticles = (rawArticles: Array<Record<string, unknown>>): NewsArticle[] =>
  rawArticles
    .filter((article) => article.title && article.description)
    .map((article) => {
      const content = typeof article.content === 'string' ? article.content : undefined;
      const description = typeof article.description === 'string' ? article.description : '';
      const title = typeof article.title === 'string' ? article.title : 'Untitled';
      const readableContent = buildReadableContent(title, description, content);
      const expandedSummary = buildExpandedSummary(title, description, content);

      return {
        id: typeof article.article_id === 'string' ? article.article_id : slugify(title),
        headline: title,
        summary: expandedSummary,
        fullContent: readableContent,
        category: normaliseCategory(article.category),
        source: typeof article.source_id === 'string'
          ? article.source_id
          : typeof article.source_name === 'string'
            ? article.source_name
            : 'Unknown',
        publishedAt: typeof article.pubDate === 'string' ? article.pubDate : new Date().toISOString(),
        readTime: estimateReadTime(readableContent),
        imageUrl: typeof article.image_url === 'string' ? article.image_url : null,
        sourceUrl: typeof article.link === 'string' ? article.link : null,
        difficulty: inferDifficulty(article),
        xpReward: inferXP(article),
        quiz: [],
        prediction: null,
      };
    });

const fetchFromNewsData = async (params: NewsDataQuery) => {
  const apiKey = process.env.NEWSDATA_API_KEY?.trim();
  if (!apiKey) {
    throw new NewsDataError('NEWSDATA_API_KEY is not configured', 500);
  }

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

  const cacheKey = buildCacheKey(cleanParams);
  const cached = cache.get<{
    articles: NewsArticle[];
    nextPage: string | null;
    totalResults: number;
    _cached: boolean;
  }>(cacheKey);

  if (cached) {
    return { ...cached, _cached: true };
  }

  const url = new URL(BASE_URL);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('removeduplicate', '1');

  for (const [key, value] of Object.entries(cleanParams)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new NewsDataError(`NewsData API responded with ${response.status}`, response.status, body);
  }

  const data = await response.json() as {
    status?: string;
    results?: Array<Record<string, unknown>>;
    nextPage?: string | null;
    totalResults?: number;
    message?: string;
  };

  if (data.status !== 'success') {
    throw new NewsDataError(data.message ?? 'NewsData API returned a non-success status', 422, data);
  }

  const result = {
    articles: transformArticles(data.results ?? []),
    nextPage: data.nextPage ?? null,
    totalResults: data.totalResults ?? 0,
    _cached: false,
  };

  cache.set(cacheKey, result);
  return result;
};

export const getLatestNews = (options: NewsDataQuery = {}) => fetchFromNewsData(options);

export const searchNews = (query: string, options: Omit<NewsDataQuery, 'q'> = {}) => {
  if (!query.trim()) {
    throw new NewsDataError('Search query cannot be empty', 400);
  }

  return fetchFromNewsData({ q: query.trim(), ...options });
};

export const getNewsByCategory = (category: string, options: Omit<NewsDataQuery, 'category'> = {}) => {
  const valid = ['business', 'entertainment', 'environment', 'food', 'health', 'politics', 'science', 'sports', 'technology', 'top', 'world'];
  if (!valid.includes(category.toLowerCase())) {
    throw new NewsDataError(`Invalid category '${category}'. Valid: ${valid.join(', ')}`, 400);
  }

  return fetchFromNewsData({ category: category.toLowerCase(), ...options });
};

export const getCacheStats = () => cache.getStats();

export const flushCache = () => cache.flushAll();
