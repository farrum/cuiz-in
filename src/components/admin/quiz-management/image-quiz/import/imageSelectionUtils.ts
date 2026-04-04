
/**
 * Utility functions for selecting appropriate images for trivia questions
 * Uses Unsplash source API with question-relevant search terms
 */

/**
 * Extract meaningful keywords from a question for image search
 */
const extractKeywords = (question: string, category: string): string => {
  // Remove common question words and filler
  const stopWords = new Set([
    'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how',
    'is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 'but',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
    'just', 'don', 'should', 'now', 'its', 'it', 'this', 'that', 'these',
    'those', 'he', 'she', 'his', 'her', 'they', 'them', 'their', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'would', 'could', 'shall', 'might', 'must', 'need', 'dare', 'ought',
    'used', 'many', 'much', 'also', 'known', 'called', 'named', 'following',
    'defined', 'number', 'originally', 'commonly', 'often', 'since',
    'about', 'does', 'according', 'among'
  ]);

  // Clean question text
  const cleaned = question
    .replace(/[^a-zA-Z\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Take up to 3 most relevant words (longer words tend to be more specific)
  const keywords = cleaned
    .sort((a, b) => b.length - a.length)
    .slice(0, 3)
    .join(',');

  // Fallback to simplified category if no keywords extracted
  if (!keywords) {
    return category.split(':').pop()?.trim().toLowerCase() || 'trivia';
  }

  return keywords;
};

/**
 * Get a relevant image URL for a trivia question using Unsplash source API
 * The URL uses question-derived keywords for relevant results
 */
export const getRandomImageForCategory = (category: string, question?: string): string => {
  const searchTerms = question 
    ? extractKeywords(question, category)
    : category.split(':').pop()?.trim().toLowerCase() || 'trivia';
  
  // Use a random seed to avoid caching the same image for different questions
  const seed = Math.random().toString(36).substring(2, 8);
  
  // Use Unsplash source API - free, no API key needed, returns relevant images
  return `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(searchTerms)}&sig=${seed}`;
};
