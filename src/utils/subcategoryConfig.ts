// Subcategory configuration shared by sitemap edge function and frontend pages.
// Each subcategory narrows a parent category by either an explicit list of DB
// categories, a keyword filter on question text, or both.
//
// IMPORTANT: This file is mirrored inside supabase/functions/sitemap-static so
// the edge function can serve subcategory sitemaps. Keep them in sync.

export interface SubcategoryDef {
  slug: string;
  name: string;
  // Limit results to questions whose `category` column is in this list.
  // If omitted, falls back to all DB categories mapped to the parent slug.
  dbCategories?: string[];
  // ANY of these keywords (case-insensitive substring) must appear in `question`.
  keywords?: string[];
}

export const subcategoriesByCategory: Record<string, SubcategoryDef[]> = {
  history: [
    { slug: 'indian-history', name: 'Indian History', keywords: ['india', 'indian', 'mughal', 'british raj', 'gandhi', 'nehru', 'ashoka', 'chola', 'maurya'] },
    { slug: 'world-wars', name: 'World Wars', keywords: ['world war', 'wwi', 'wwii', 'hitler', 'nazi', 'allies', 'axis'] },
    { slug: 'ancient-history', name: 'Ancient History', keywords: ['ancient', ' bc', 'egypt', 'roman', 'rome', 'greek', 'mesopotamia'] },
    { slug: 'medieval', name: 'Medieval Period', keywords: ['medieval', 'middle ages', 'crusade', 'knight', 'feudal'] },
    { slug: 'modern-history', name: 'Modern History', keywords: ['cold war', 'revolution', '19th century', '20th century', 'industrial'] },
  ],
  science: [
    { slug: 'physics', name: 'Physics', keywords: ['physics', 'force', 'gravity', 'quantum', 'electron', 'newton', 'einstein', 'energy'] },
    { slug: 'chemistry', name: 'Chemistry', keywords: ['chemical', 'atom', 'molecule', 'element', 'reaction', 'acid', 'periodic'] },
    { slug: 'biology', name: 'Biology', keywords: ['cell', 'dna', 'organism', 'species', 'biology', 'genetic', 'enzyme'] },
    { slug: 'astronomy', name: 'Astronomy', keywords: ['planet', 'star', 'galaxy', 'solar', 'moon', 'universe', 'nasa', 'asteroid'] },
    { slug: 'mathematics', name: 'Mathematics', dbCategories: ['Science: Mathematics'] },
    { slug: 'nature', name: 'Nature', dbCategories: ['Nature'] },
  ],
  geography: [
    { slug: 'countries-capitals', name: 'Countries & Capitals', keywords: ['capital', 'country', 'nation'] },
    { slug: 'landmarks', name: 'Landmarks & Wonders', keywords: ['landmark', 'wonder', 'monument', 'tower', 'pyramid'] },
    { slug: 'physical-geography', name: 'Physical Geography', keywords: ['mountain', 'river', 'ocean', 'desert', 'lake', 'sea'] },
    { slug: 'indian-geography', name: 'Indian Geography', keywords: ['india', 'indian', 'himalaya', 'ganges', 'delhi', 'mumbai'] },
  ],
  literature: [
    { slug: 'books', name: 'Books & Novels', dbCategories: ['Entertainment: Books'] },
    { slug: 'art', name: 'Art', dbCategories: ['Art', 'Arts & Literature', 'Arts and Literature'] },
  ],
  entertainment: [
    { slug: 'movies', name: 'Movies', dbCategories: ['Entertainment: Film'] },
    { slug: 'music', name: 'Music', dbCategories: ['Entertainment: Music'] },
    { slug: 'television', name: 'Television', dbCategories: ['Entertainment: Television'] },
    { slug: 'video-games', name: 'Video Games', dbCategories: ['Entertainment: Video Games'] },
    { slug: 'celebrities', name: 'Celebrities', dbCategories: ['Celebrities'] },
    { slug: 'anime-manga', name: 'Anime & Manga', dbCategories: ['Entertainment: Japanese Anime & Manga', 'Entertainment: Japanese Anime &amp; Manga'] },
    { slug: 'cartoons', name: 'Cartoons & Animation', dbCategories: ['Entertainment: Cartoon & Animations', 'Entertainment: Cartoon &amp; Animations'] },
    { slug: 'board-games', name: 'Board Games', dbCategories: ['Entertainment: Board Games'] },
    { slug: 'bollywood', name: 'Bollywood', keywords: ['bollywood', 'shah rukh', 'amitabh', 'salman khan', 'aamir khan', 'hindi film'] },
  ],
  sports: [
    { slug: 'cricket', name: 'Cricket', dbCategories: ['Cricket'] },
    { slug: 'football', name: 'Football / Soccer', keywords: ['football', 'fifa', 'world cup', 'soccer', 'premier league'] },
    { slug: 'tennis', name: 'Tennis', keywords: ['tennis', 'wimbledon', 'grand slam', 'federer', 'nadal'] },
    { slug: 'olympics', name: 'Olympics', keywords: ['olympic', 'olympics'] },
    { slug: 'basketball', name: 'Basketball', keywords: ['basketball', 'nba'] },
  ],
  technology: [
    { slug: 'computers', name: 'Computers', dbCategories: ['Science: Computers'] },
    { slug: 'gadgets', name: 'Gadgets', dbCategories: ['Science: Gadgets'] },
    { slug: 'vehicles', name: 'Vehicles', dbCategories: ['Vehicles'] },
    { slug: 'programming', name: 'Programming', keywords: ['programming', 'language', 'code', 'developer', 'python', 'javascript', 'java '] },
    { slug: 'ai-robotics', name: 'AI & Robotics', keywords: ['artificial intelligence', ' ai ', 'robot', 'machine learning', 'neural'] },
    { slug: 'internet', name: 'Internet & Web', keywords: ['internet', 'web', 'browser', 'http', 'url', 'website'] },
  ],
  'general-knowledge': [
    { slug: 'mythology', name: 'Mythology', dbCategories: ['Mythology'] },
    { slug: 'animals', name: 'Animals', dbCategories: ['Animals'] },
    { slug: 'food-drink', name: 'Food & Drink', dbCategories: ['Food & Drink', 'Food and Drinks'] },
    { slug: 'politics', name: 'Politics', dbCategories: ['Politics'] },
    { slug: 'culture', name: 'Culture', dbCategories: ['Culture'] },
  ],
};

export function getSubcategories(parentSlug: string): SubcategoryDef[] {
  return subcategoriesByCategory[parentSlug] || [];
}

export function getSubcategory(parentSlug: string, subSlug: string): SubcategoryDef | undefined {
  return getSubcategories(parentSlug).find((s) => s.slug === subSlug);
}