import { extractBytezText, getBytezModel, hasBytezKey } from './bytez.js';

export interface GeneratedQuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedPredictionItem {
  question: string;
  options: string[];
  deadline: string;
  xpReward: number;
}

export interface GeneratedArticleContent {
  headline: string;
  summary: string;
  quiz: GeneratedQuizItem[];
  prediction: GeneratedPredictionItem;
}

export interface NewsArticleInput {
  headline: string;
  summary: string;
  fullContent: string;
  category: string;
  source: string;
  publishedAt: string;
}

const SUMMARY_WORD_TARGET = 200;

const extractKeyTerms = (text: string) => {
  const words = text
    .replace(/[^A-Za-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(word => word.trim())
    .filter(word => word.length >= 4);

  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'will', 'been', 'were', 'into', 'about', 'after', 'before', 'over',
    'news', 'more', 'some', 'than', 'when', 'what', 'where', 'which', 'their', 'there', 'they', 'them', 'this',
    'said', 'says', 'could', 'would', 'should', 'also', 'only', 'just', 'then', 'even', 'each', 'such', 'made',
    'make', 'most', 'very', 'been', 'have', 'has', 'had', 'its', 'for', 'the', 'and', 'are', 'was', 'that',
  ]);

  const terms = words
    .filter(word => !stopWords.has(word.toLowerCase()))
    .map(word => word.replace(/^-+|-+$/g, ''))
    .filter(Boolean);

  return Array.from(new Set(terms)).slice(0, 6);
};

const pickTopic = (article: NewsArticleInput) => {
  const sourceText = `${article.headline} ${article.summary} ${article.category}`.toLowerCase();
  if (sourceText.includes('ai') || sourceText.includes('artificial intelligence') || sourceText.includes('neural')) return 'AI';
  if (sourceText.includes('election') || sourceText.includes('vote') || sourceText.includes('parliament') || sourceText.includes('court')) return 'Politics';
  if (sourceText.includes('market') || sourceText.includes('stock') || sourceText.includes('economy') || sourceText.includes('trade')) return 'Economy';
  if (sourceText.includes('space') || sourceText.includes('mars') || sourceText.includes('nasa') || sourceText.includes('isro')) return 'Science';
  if (sourceText.includes('health') || sourceText.includes('medical') || sourceText.includes('hospital') || sourceText.includes('drug')) return 'Health';
  if (sourceText.includes('sport') || sourceText.includes('cricket') || sourceText.includes('football') || sourceText.includes('olympic')) return 'Sports';
  return article.category || 'General';
};

const futureDate = (daysAhead: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
};

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const countWords = (value: string) => normalizeText(value).split(/\s+/).filter(Boolean).length;

const toExactWordCount = (text: string, targetWords: number) => {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  return words.slice(0, targetWords).join(' ');
};

const buildFastHeadline = (article: NewsArticleInput) => {
  const base = article.headline.replace(/\s+/g, ' ').trim();
  const topic = pickTopic(article);
  if (!base) return `${topic} update draws attention to key developments`;

  const trimmed = base.length > 90 ? `${base.slice(0, 87).trim()}...` : base;
  return `${topic}: ${trimmed}`;
};

const buildSummaryPadding = (article: NewsArticleInput) => {
  const headline = normalizeText(article.headline);
  const summary = normalizeText(article.summary);
  const content = normalizeText(article.fullContent);
  const topic = pickTopic(article).toLowerCase();
  const terms = extractKeyTerms(`${article.headline} ${article.summary} ${article.fullContent}`);
  const primary = terms[0] ?? topic;
  const secondary = terms[1] ?? primary;
  const tertiary = terms[2] ?? secondary;
  const source = normalizeText(article.source || 'the original report');
  const published = normalizeText(article.publishedAt || 'recently');

  return [
    `The story begins with ${headline || 'a developing news update'} and the immediate details already suggest that the report has wider consequences than a simple headline might imply. The people, institutions, or events named in the article matter because they help define the scale of the update and show whether the change is isolated or part of a longer pattern. That distinction is important for readers who want to understand not just what happened, but why the event is being covered now.`,
    `${summary || headline || 'The article summary'} provides the core facts, but the broader meaning comes from how those facts connect to ${primary}. When a report moves through public conversation, policy, markets, or day-to-day decisions, the context becomes just as important as the announcement itself. Readers should pay attention to what changed, what remained uncertain, and which parts of the story still need confirmation from later reporting.`,
    `Additional detail from ${source} and the rest of the available reporting helps show the timeline more clearly. The publication date of ${published} places the news in a specific moment, which matters because fast-moving stories can shift quickly after new statements, official reactions, or follow-up data. That is why NewsQuest expands the summary: a longer explanation gives readers enough information to understand the story before they even open the full article.`,
    `Another useful way to read the update is to look at the relationship between ${primary}, ${secondary}, and ${tertiary}. Those signals often reveal whether the story is about a one-time event, an ongoing dispute, or the early stage of a bigger development. If the article is about politics, economics, science, health, or technology, those connections help explain the practical effects, the likely response from stakeholders, and the questions that will matter in the next round of coverage.`,
    `${content ? `The underlying report also contains language and context that can deepen the reader's understanding. ${content.slice(0, 900)}` : 'Even when the source text is limited, the available article details still point to a meaningful update that deserves a careful explanation.'} This is important because a long summary should not simply repeat the headline. It should clarify the situation, restate the central facts in a more readable format, and explain the consequences in plain language so the reader can follow the story without needing to search elsewhere.`,
    `Looking ahead, the most useful question is how this development may evolve after the initial report. Follow-up announcements, official clarifications, additional evidence, and public reactions will determine whether the story gains momentum or stabilizes. That is why the expanded summary stays with the article rather than shrinking it into a short teaser. A 500-word explanation gives the reader enough depth to understand the issue, compare later updates against the original report, and remember the key facts more clearly.`,
  ].join('\n\n');
};

const buildFastSummary = (article: NewsArticleInput) => {
  const headline = normalizeText(article.headline);
  const topic = pickTopic(article);
  const summary = normalizeText(article.summary);
  const content = normalizeText(article.fullContent);

  const baseSummary = [
    `${summary || headline} This story sits inside a larger ${topic.toLowerCase()} discussion and deserves a full reading because the details shape how the event is interpreted. A short headline only captures the surface, while the underlying report explains the people, institutions, decisions, and timing that make the development important. That context helps the reader understand whether the news is a sudden change, a continuation of an ongoing issue, or the first sign of something broader.`,
    `At the center of the article is the main action or decision being reported, together with the immediate consequences for the groups involved. Readers should look carefully at what changed, why it changed, and who is likely to feel the effect first. That approach turns the story from a simple update into something more useful, because it shows the practical meaning behind the event rather than only the visible headline.`,
    `The wider significance comes from how the story may influence public debate, official responses, market movement, social reactions, or future coverage depending on the topic. When a report moves quickly, the chain of cause and effect matters just as much as the announcement itself. Understanding that chain makes it easier to compare later statements with the original facts and to see whether the situation is building toward a larger outcome.`,
    `A detailed summary also helps separate core facts from the surrounding noise. ${content ? content.slice(0, 420) : headline} This extra context makes the article easier to follow because it highlights the timeline, the major names, and the likely next steps in plain language. For NewsQuest, the goal is not to produce a short teaser. The goal is to create a study-style summary that gives enough information for the reader to understand the story before opening the full article.`,
    `Overall, the report should be read as an evolving story with several moving parts. Monitoring follow-up statements, fresh data, official clarification, and public reaction will show whether the original direction continues or changes. This longer summary is intentionally designed to be detailed enough to stand on its own, so a reader can grasp the main facts, the significance, and the likely implications without needing extra background research.`,
    buildSummaryPadding(article),
  ].join('\n\n');

  return toExactWordCount(`${baseSummary}\n\n${buildSummaryPadding(article)}`, SUMMARY_WORD_TARGET);
};

export const buildFastArticleContent = (article: NewsArticleInput): GeneratedArticleContent => {
  const topic = pickTopic(article);
  const headline = article.headline.replace(/\s+/g, ' ').trim();
  const terms = extractKeyTerms(`${article.headline} ${article.summary}`);
  const firstTerm = terms[0] ?? topic;
  const secondTerm = terms[1] ?? firstTerm;

  return {
    headline: buildFastHeadline(article),
    summary: toExactWordCount(buildFastSummary(article), SUMMARY_WORD_TARGET),
    quiz: [
      {
        question: `Which detail is most central to this article?`,
        options: [firstTerm, 'A celebrity profile', 'A sports transfer', 'A travel feature'],
        correctIndex: 0,
        explanation: `The headline and summary repeatedly point to ${firstTerm}.`,
      },
      {
        question: `What is the strongest implication of the report?`,
        options: [
          `It could lead to follow-up coverage around ${secondTerm}`,
          'It is likely to be ignored completely',
          'It is unrelated to any current issue',
          'It only matters as background trivia',
        ],
        correctIndex: 0,
        explanation: `The story is active enough that ${secondTerm} should trigger more reporting.`,
      },
      {
        question: `What kind of evidence is the article mainly based on?`,
        options: ['Headline and news summary', 'A personal opinion post', 'A fictional scenario', 'A product review'],
        correctIndex: 0,
        explanation: 'This news item is drawn from the headline and summary provided by the article.',
      },
      {
        question: `Which answer best matches the article’s category?`,
        options: [
          article.category || 'General',
          'Lifestyle',
          'Entertainment',
          'Travel',
        ],
        correctIndex: 0,
        explanation: 'The category tag tells you which section this article belongs to.',
      },
    ],
    prediction: {
      question: `What is the most likely next development for this article about ${firstTerm}?`,
      options: [
        `More reporting or updates on ${firstTerm}`,
        `The story ends without further changes`,
        `A reversal of the main trend described`,
      ],
      deadline: futureDate(30),
      xpReward: 25,
    },
  };
};

const buildPrompt = (article: NewsArticleInput) => `
You are generating NewsQuest gameplay content from a news article.

Return valid JSON only, with this exact shape:
{
  "headline": "string",
  "summary": "string",
  "quiz": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ],
  "prediction": {
    "question": "string",
    "options": ["Option 1", "Option 2", "Option 3"],
    "deadline": "YYYY-MM-DD",
    "xpReward": 25
  }
}

Rules:
- Write exactly 4 quiz questions.
- Quiz options must be short, distinct, and grounded in the article.
- At least 2 questions should require inference or careful reading, not just headline recognition.
- Each question should be specific to the article's actual subject matter, names, places, events, or implications.
- correctIndex must be 0, 1, 2, or 3.
- Prediction should be article-specific, forward-looking, and should mention the subject in the question.
- Keep the prediction options short and mutually exclusive.
- Deadline must be a future date in YYYY-MM-DD format.
- xpReward should be an integer between 20 and 50.
- Headline should be a polished, complete headline of 12 to 20 words, specific to the story.
- Summary should be detailed and substantial, at least 500 words across 5 to 7 short paragraphs.
- The summary must read like a full explanatory overview, not a teaser.
- Do not include markdown or extra commentary.

Article:
Headline: ${article.headline}
Summary: ${article.summary}
Category: ${article.category}
Source: ${article.source}
Published: ${article.publishedAt}
Full content or notes: ${article.fullContent}
Key terms: ${extractKeyTerms(`${article.headline} ${article.summary} ${article.fullContent}`).join(', ') || 'none'}

Important:
- Use the headline and summary as the main source of truth.
- Prefer article-specific nouns and facts over generic placeholders.
- Make the quiz progressively harder: question 1 factual, question 2 detail-based, question 3 inference-based, question 4 implications or consequence-based.
- If the full content is missing, generic, or paywalled, infer from the headline and summary instead.
`;

const normaliseGeneratedContent = (article: NewsArticleInput, parsed: GeneratedArticleContent): GeneratedArticleContent => {
  const fallback = buildFastArticleContent(article);
  const quiz = Array.isArray(parsed.quiz) ? parsed.quiz.slice(0, 4) : [];

  while (quiz.length < 4) {
    const next = fallback.quiz[quiz.length];
    if (!next) break;
    quiz.push(next);
  }

  return {
    headline: typeof parsed.headline === 'string' && parsed.headline.trim() ? parsed.headline.trim() : fallback.headline,
    summary: (() => {
      const candidate = typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : fallback.summary;
      return toExactWordCount(`${candidate}\n\n${buildSummaryPadding(article)}`, SUMMARY_WORD_TARGET);
    })(),
    quiz,
    prediction: parsed.prediction ?? fallback.prediction,
  };
};

const parseGeneratedContent = (article: NewsArticleInput, raw: string): GeneratedArticleContent => {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const jsonText = start >= 0 && end >= start ? raw.slice(start, end + 1) : raw;
  const data = JSON.parse(jsonText) as GeneratedArticleContent;

  if (!Array.isArray(data.quiz) || data.quiz.length < 2 || !data.prediction) {
    throw new Error('Unexpected Bytez response format.');
  }

  const deadlineDate = new Date(data.prediction.deadline);
  const now = new Date();
  if (Number.isNaN(deadlineDate.getTime()) || deadlineDate <= now) {
    const fallback = new Date(now);
    fallback.setUTCDate(fallback.getUTCDate() + 90);
    data.prediction.deadline = fallback.toISOString().slice(0, 10);
  }

  data.prediction.xpReward = Math.min(50, Math.max(20, Math.round(data.prediction.xpReward || 30)));

  return normaliseGeneratedContent(article, data);
};

export const canGenerateArticleContent = hasBytezKey;

let generationQueue: Promise<void> = Promise.resolve();
const generatedContentCache = new Map<string, GeneratedArticleContent>();
const MAX_CACHE_ENTRIES = 50;

const buildCacheKey = (article: NewsArticleInput) =>
  [article.headline, article.summary, article.fullContent, article.category, article.source, article.publishedAt]
    .join('||')
    .toLowerCase();

const rememberGeneratedContent = (key: string, content: GeneratedArticleContent) => {
  generatedContentCache.set(key, content);
  if (generatedContentCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = generatedContentCache.keys().next().value as string | undefined;
    if (oldestKey) {
      generatedContentCache.delete(oldestKey);
    }
  }
};

const runQueuedGeneration = async <T>(task: () => Promise<T>): Promise<T> => {
  let release!: () => void;
  const current = generationQueue.then(() => new Promise<void>((resolve) => {
    release = resolve;
  }));
  generationQueue = current.catch(() => undefined);

  await current;
  try {
    return await task();
  } finally {
    release();
  }
};

export async function generateArticleContent(article: NewsArticleInput): Promise<GeneratedArticleContent> {
  const cacheKey = buildCacheKey(article);
  const cached = generatedContentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  return runQueuedGeneration(async () => {
    const afterQueueCached = generatedContentCache.get(cacheKey);
    if (afterQueueCached) {
      return afterQueueCached;
    }

    const model = getBytezModel();
    const { error, output } = await model.run([
      {
        role: 'system',
        content: 'You are a precise JSON generator for a news quiz app.',
      },
      {
        role: 'user',
        content: buildPrompt(article),
      },
    ]);

    if (error) {
      throw new Error(typeof error === 'string' ? error : 'Bytez generation failed.');
    }

    const text = extractBytezText(output);

    if (!text) {
      throw new Error('Bytez returned an unexpected output type.');
    }

    const parsed = parseGeneratedContent(article, text);
    rememberGeneratedContent(cacheKey, parsed);
    return parsed;
  });
}
