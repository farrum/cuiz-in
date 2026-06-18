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
  'Nature': 'science',
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
  'Entertainment: Music': 'entertainment',
  'Entertainment: Film': 'entertainment',
  'Entertainment: Television': 'entertainment',
  'Entertainment: Board Games': 'entertainment',
  'Entertainment: Musicals &amp; Theatres': 'entertainment',
  'Entertainment: Japanese Anime &amp; Manga': 'entertainment',
  'Entertainment: Cartoon &amp; Animations': 'entertainment',
  'Entertainment: Comics': 'entertainment',
  'Celebrities': 'entertainment',
  'Bollywood': 'entertainment',
  'World Music': 'entertainment',
  
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
  'Mythology': 'general-knowledge',
  'Politics': 'general-knowledge',
  'Current Affairs': 'general-knowledge',
  'Global Politics': 'general-knowledge',
  'Kids Corner': 'general-knowledge',
  
  // Guinness World Records
  'Guinness World Records': 'guinness-world-records',
};

// Reverse map: slug to valid category names array
export const slugToCategoriesMap: Record<string, string[]> = {
  'history': ['History', 'Indian History'],
  'science': ['Science', 'Science & Nature', 'Science &amp; Nature', 'Nature', 'Science: Mathematics', 'Mathematics'],
  'geography': ['Geography'],
  'literature': ['Arts & Literature', 'Arts and Literature', 'Entertainment: Books', 'Art', 'Literature'],
  'entertainment': [
    'Entertainment', 'Entertainment: Video Games', 'Entertainment: Music', 
    'Entertainment: Film', 'Entertainment: Television', 'Entertainment: Board Games',
    'Entertainment: Musicals &amp; Theatres', 'Entertainment: Japanese Anime &amp; Manga',
    'Entertainment: Cartoon &amp; Animations', 'Entertainment: Comics', 'Celebrities',
    'Bollywood', 'World Music'
  ],
  'sports': ['Sports', 'Cricket'],
  'technology': ['Science: Computers', 'Science: Gadgets', 'Science and Technology', 'Science & Technology', 'Vehicles', 'Technology'],
  'general-knowledge': ['General Knowledge', 'Culture', 'Animals', 'Food & Drink', 'Food and Drinks', 'Mythology', 'Politics', 'Current Affairs', 'Global Politics', 'Kids Corner'],
  'guinness-world-records': ['Guinness World Records'],
};

// Valid frontend category slugs
export const validCategorySlugs = [
  'history', 'science', 'geography', 'literature', 
  'entertainment', 'sports', 'technology', 'general-knowledge',
  'guinness-world-records'
];

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
  return validCategorySlugs.includes(slug);
};

/**
 * Get all database categories that map to a given slug
 */
export const getCategoriesForSlug = (slug: string): string[] => {
  return slugToCategoriesMap[slug] || [];
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
  };
  return displayNames[slug] || slug;
};
