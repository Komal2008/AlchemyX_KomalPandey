import type { Article } from '@/store/gameStore';

const pickTopic = (article: Pick<Article, 'headline' | 'summary' | 'category'>) => {
  const sourceText = `${article.headline} ${article.summary} ${article.category}`.toLowerCase();
  if (sourceText.includes('ai') || sourceText.includes('artificial intelligence') || sourceText.includes('neural')) return 'AI';
  if (sourceText.includes('election') || sourceText.includes('vote') || sourceText.includes('parliament') || sourceText.includes('court')) return 'Politics';
  if (sourceText.includes('market') || sourceText.includes('stock') || sourceText.includes('economy') || sourceText.includes('trade')) return 'Economy';
  if (sourceText.includes('space') || sourceText.includes('mars') || sourceText.includes('nasa') || sourceText.includes('isro')) return 'Science';
  if (sourceText.includes('health') || sourceText.includes('medical') || sourceText.includes('hospital') || sourceText.includes('drug')) return 'Health';
  if (sourceText.includes('sport') || sourceText.includes('cricket') || sourceText.includes('football') || sourceText.includes('olympic')) return 'Sports';
  return article.category || 'General';
};

const extractKeyTerms = (text: string) => {
  const words = text
    .replace(/[^A-Za-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(word => word.trim())
    .filter(word => word.length >= 4);

  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'will', 'been', 'were', 'into', 'about', 'after', 'before', 'over',
    'news', 'more', 'some', 'than', 'when', 'what', 'where', 'which', 'their', 'there', 'they', 'them', 'said',
    'says', 'could', 'would', 'should', 'also', 'only', 'just', 'then', 'even', 'each', 'such', 'made', 'make',
    'most', 'very', 'for', 'the', 'and', 'are', 'was', 'that',
  ]);

  return Array.from(new Set(words.filter(word => !stopWords.has(word.toLowerCase())))).slice(0, 6);
};

const futureDate = (daysAhead: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
};

export const buildFastGameplay = (article: Pick<Article, 'headline' | 'summary' | 'category'>) => {
  const topic = pickTopic(article);
  const terms = extractKeyTerms(`${article.headline} ${article.summary}`);
  const firstTerm = terms[0] ?? topic;
  const secondTerm = terms[1] ?? firstTerm;
  const thirdTerm = terms[2] ?? (article.category || 'General');

  return {
    quiz: [
      {
        id: 'q1',
        question: 'Which detail is most central to this article?',
        options: [firstTerm, 'A celebrity profile', 'A sports transfer', 'A travel feature'],
        correct: 0,
        explanation: `The headline and summary repeatedly point to ${firstTerm}.`,
      },
      {
        id: 'q2',
        question: 'What is the strongest implication of the report?',
        options: [
          `It could lead to follow-up coverage around ${secondTerm}`,
          'It is likely to be ignored completely',
          'It is unrelated to any current issue',
          'It only matters as background trivia',
        ],
        correct: 0,
        explanation: `The story is active enough that ${secondTerm} should trigger more reporting.`,
      },
      {
        id: 'q3',
        question: 'What kind of evidence is the article mainly based on?',
        options: ['Headline and news summary', 'A personal opinion post', 'A fictional scenario', 'A product review'],
        correct: 0,
        explanation: 'This news item is drawn from the headline and summary provided by the article.',
      },
      {
        id: 'q4',
        question: 'Which answer best matches the article’s category?',
        options: [thirdTerm, 'Lifestyle', 'Entertainment', 'Travel'],
        correct: 0,
        explanation: 'The category tag tells you which section this article belongs to.',
      },
    ],
    prediction: {
      id: 'p1',
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
