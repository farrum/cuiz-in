/**
 * Category mapping utility to map database categories to frontend slugs
 * This ensures consistency between sitemap URLs and frontend routing
 */

// Map database category names to frontend slugs
export const categoryToSlugMap: Record<string, string> = {
  // History
  'History': 'history',
  'Indian History': 'history',
  
  // Science (multiple DB categories)
  'Science': 'science',
  'Science & Nature': 'science',
  'Science &amp; Nature': 'science',
  'Science: Computers': 'technology',
  'Science: Gadgets': 'technology',
  'Science: Mathematics': 'science',
  'Mathematics': 'science',
  'Science and Technology': 'technology',
  'Science & Technology': 'technology',
  'Technology': 'technology',
  
  // Geography
  'Geography': 'geography',
  
  // Literature
  'Arts & Literature': 'literature',
  'Arts and Literature': 'literature',
  'Entertainment: Books': 'literature',
  'Literature': 'literature',
  'Art': 'literature',
  
  // Entertainment (multiple DB categories)
  'Entertainment': 'entertainment',
  'Entertainment: Video Games': 'entertainment',
  'Entertainment: Music': 'music',
  'Entertainment: Film': 'entertainment',
  'Entertainment: Television': 'entertainment',
  'Entertainment: Board Games': 'entertainment',
  'Entertainment: Musicals &amp; Theatres': 'entertainment',
  'Entertainment: Japanese Anime &amp; Manga': 'entertainment',
  'Entertainment: Cartoon &amp; Animations': 'entertainment',
  'Entertainment: Comics': 'entertainment',
  'Celebrities': 'entertainment',
  'Bollywood': 'entertainment',
  
  // Sports
  'Sports': 'sports',
  'Cricket': 'sports',
  
  // Technology
  'Vehicles': 'technology',
  
  // General Knowledge (multiple DB categories)
  'General Knowledge': 'general-knowledge',
  'Culture': 'general-knowledge',
  'Animals': 'general-knowledge',
  'Food & Drink': 'general-knowledge',
  'Food and Drinks': 'general-knowledge',
  
  // Guinness World Records
  'Guinness World Records': 'guinness-world-records',

  // K-Pop & K-Drama
  'K-Pop Music': 'k-pop-k-drama',
  'Korean Drama': 'k-pop-k-drama',
  'K-Pop & K-Drama': 'k-pop-k-drama',

  // Global Politics
  'Global Politics': 'global-politics',
  'Politics': 'global-politics',
  'Current Affairs': 'global-politics',

  // Kids Corner
  'Kids Corner': 'kids-trivia',

  // Law & Justice
  'Law & Justice': 'law-justice',

  // World Music
  'World Music': 'music',

  // Environment / Nature
  'Environment': 'environment-nature',
  'Nature': 'environment-nature',

  // Business
  'Business': 'business-finance',

  // Mythology
  'Mythology': 'mythology',

  // Misc geography
  'World Landmarks': 'geography',
};

// Reverse map: slug to valid category names array
export const slugToCategoriesMap: Record<string, string[]> = {
  'history': ['History', 'Indian History'],
  'science': ['Science', 'Science & Nature', 'Science &amp; Nature', 'Science: Mathematics', 'Mathematics'],
  'geography': ['Geography', 'World Landmarks'],
  'literature': ['Arts & Literature', 'Arts and Literature', 'Entertainment: Books', 'Art', 'Literature'],
  'entertainment': [
    'Entertainment', 'Entertainment: Video Games', 
    'Entertainment: Film', 'Entertainment: Television', 'Entertainment: Board Games',
    'Entertainment: Musicals &amp; Theatres', 'Entertainment: Japanese Anime &amp; Manga',
    'Entertainment: Cartoon &amp; Animations', 'Entertainment: Comics', 'Celebrities',
    'Bollywood'
  ],
  'sports': ['Sports', 'Cricket'],
  'technology': ['Science: Computers', 'Science: Gadgets', 'Science and Technology', 'Science & Technology', 'Vehicles', 'Technology'],
  'general-knowledge': ['General Knowledge', 'Culture', 'Animals', 'Food & Drink', 'Food and Drinks'],
  'guinness-world-records': ['Guinness World Records'],
  'k-pop-k-drama': ['K-Pop Music', 'Korean Drama', 'K-Pop & K-Drama'],
  'global-politics': ['Global Politics', 'Politics', 'Current Affairs'],
  'kids-trivia': ['Kids Corner'],
  'law-justice': ['Law & Justice'],
  'music': ['World Music', 'Entertainment: Music'],
  'environment-nature': ['Environment', 'Nature'],
  'business-finance': ['Business'],
  'mythology': ['Mythology'],
};

// Valid frontend category slugs
export const validCategorySlugs = [
  'history', 'science', 'geography', 'literature', 
  'entertainment', 'sports', 'technology', 'general-knowledge',
  'guinness-world-records', 'k-pop-k-drama',
  'global-politics', 'kids-trivia', 'law-justice', 'music',
  'environment-nature', 'business-finance', 'mythology'
];

/**
 * Full list of distinct DB category names. Used to resolve raw category slugs
 * (generated directly from a DB category name) that don't match a grouped slug.
 */
const ALL_DB_CATEGORIES = Object.keys(categoryToSlugMap);

/**
 * Normalize a string into a slug the same way the Categories page does.
 */
const normalizeToSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Convert a database category name to a frontend slug
 */
export const getCategorySlug = (dbCategory: string): string => {
  return categoryToSlugMap[dbCategory] || 'general-knowledge';
};

/**
 * Check if a slug is valid
 */
export const isValidCategorySlug = (slug: string): boolean => {
  if (validCategorySlugs.includes(slug)) return true;
  // Accept raw slugs generated directly from a DB category name
  return ALL_DB_CATEGORIES.some((cat) => normalizeToSlug(cat) === slug);
};

/**
 * Get all database categories that map to a given slug
 */
export const getCategoriesForSlug = (slug: string): string[] => {
  if (slugToCategoriesMap[slug]) return slugToCategoriesMap[slug];
  // Fall back to any DB category whose normalized slug matches
  const matches = ALL_DB_CATEGORIES.filter((cat) => normalizeToSlug(cat) === slug);
  return matches;
};

/**
 * Get category display name from slug
 */
export const getCategoryDisplayName = (slug: string): string => {
  const displayNames: Record<string, string> = {
    'history': 'History',
    'science': 'Science',
    'geography': 'Geography',
    'literature': 'Literature',
    'entertainment': 'Entertainment',
    'sports': 'Sports',
    'technology': 'Technology',
    'general-knowledge': 'General Knowledge',
    'guinness-world-records': 'Guinness World Records',
    'k-pop-k-drama': 'K-Pop & K-Drama',
    'global-politics': 'Global Politics',
    'kids-trivia': 'Kids Corner',
    'law-justice': 'Law & Justice',
    'music': 'World Music',
    'environment-nature': 'Environment',
    'business-finance': 'Business',
  };
  if (displayNames[slug]) return displayNames[slug];
  // Derive a friendly name from a raw DB-category slug
  const dbMatch = ALL_DB_CATEGORIES.find((cat) => normalizeToSlug(cat) === slug);
  if (dbMatch) return dbMatch.replace(/&amp;/g, '&');
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};
