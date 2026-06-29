// Subcategory configuration shared by sitemap edge function and frontend pages.
// Each subcategory narrows a parent category by either an explicit list of DB
// categories, a keyword filter on question text, or both.
//
// IMPORTANT: This file is mirrored inside supabase/functions/sitemap-static so
// the edge function can serve subcategory sitemaps. Keep them in sync.

import { getCategorySlug } from './categoryMapping';

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
    { slug: 'space-exploration', name: 'Space & Exploration', keywords: ['nasa', 'spacex', 'mars', 'iss', 'astronaut', 'rocket', 'satellite', 'apollo', 'space station', 'lunar'] },
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
    { slug: 'ai-machine-learning', name: 'AI & Machine Learning', keywords: ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'chatgpt', 'openai', 'llm', 'gpt', 'generative ai', 'transformer'] },
    { slug: 'electric-vehicles', name: 'Electric Vehicles', keywords: ['tesla', 'electric vehicle', ' ev ', 'evs', 'lithium', 'battery', 'rivian', 'charging station', 'hybrid car'] },
  ],
  'general-knowledge': [
    { slug: 'animals', name: 'Animals', dbCategories: ['Animals'] },
    { slug: 'food-drink', name: 'Food & Drink', dbCategories: ['Food & Drink', 'Food and Drinks'] },
    { slug: 'culture', name: 'Culture', dbCategories: ['Culture'] },
    { slug: 'green-energy', name: 'Green Energy & Sustainability', keywords: ['solar', 'wind energy', 'renewable', 'sustainability', 'climate', 'carbon', 'greenhouse', 'hydro', 'geothermal', 'biofuel', 'recycling'] },
  ],
  'guinness-world-records': [
    { slug: 'human-achievements', name: 'Human Achievements', keywords: ['tallest', 'shortest', 'oldest', 'youngest', 'most', 'longest', 'fastest', 'human'] },
    { slug: 'sports-records', name: 'Sports Records', keywords: ['olympic', 'world cup', 'record', 'athlete', 'marathon', 'swimming', 'boxing'] },
    { slug: 'nature-records', name: 'Nature & Animals', keywords: ['animal', 'tree', 'flower', 'ocean', 'mountain', 'river', 'desert', 'largest animal'] },
    { slug: 'food-records', name: 'Food Records', keywords: ['pizza', 'burger', 'cake', 'largest food', 'spicy', 'eating', 'cooking'] },
    { slug: 'entertainment-records', name: 'Entertainment Records', keywords: ['movie', 'song', 'album', 'concert', 'film', 'box office', 'streaming'] },
    { slug: 'science-records', name: 'Science & Technology', keywords: ['space', 'rocket', 'satellite', 'computer', 'robot', 'experiment', 'laboratory'] },
  ],
  'k-pop-k-drama': [
    { slug: 'k-pop-music', name: 'K-Pop Music', dbCategories: ['K-Pop Music', 'K-Pop & K-Drama'], keywords: ['k-pop', 'kpop', 'bts', 'blackpink', 'exo', 'twice', 'music', 'album', 'song'] },
    { slug: 'korean-drama', name: 'Korean Drama', dbCategories: ['Korean Drama', 'K-Pop & K-Drama'], keywords: ['drama', 'k-drama', 'kdrama', 'squid game', 'crash landing', 'actor', 'actress', 'series'] }
  ],
  'mythology': [
    { slug: 'greek-mythology', name: 'Greek Mythology', keywords: ['greek', 'zeus', 'hera', 'poseidon', 'hades', 'apollo', 'athena', 'hercules', 'olympus', 'perseus'] },
    { slug: 'norse-mythology', name: 'Norse Mythology', keywords: ['norse', 'thor', 'odin', 'loki', 'valhalla', 'asgard', 'ragnarok', 'mjolnir', 'freyja'] },
    { slug: 'egyptian-mythology', name: 'Egyptian Mythology', keywords: ['egyptian', 'isis', 'osiris', 'horus', 'ra ', 'anubis', 'pharaoh', 'sphinx', 'seth'] },
    { slug: 'hindu-mythology', name: 'Hindu Mythology', keywords: ['hindu', 'ramayana', 'mahabharata', 'krishna', 'rama', 'shiva', 'vishnu', 'brahma', 'ganesha', 'arjuna'] },
  ],
  'global-politics': [
    { slug: 'indian-politics', name: 'Indian Politics', keywords: ['india', 'modi', 'gandhi', 'nehru', 'parliament', 'lok sabha', 'bjp', 'congress'] },
    { slug: 'world-politics', name: 'World Politics', keywords: ['us president', 'united nations', 'un ', 'treaty', 'democracy', 'election', 'minister', 'prime minister', 'senate'] },
    { slug: 'current-affairs', name: 'Current Affairs', dbCategories: ['Current Affairs'] },
  ],
};

export function getSubcategories(parentSlug: string): SubcategoryDef[] {
  return subcategoriesByCategory[parentSlug] || [];
}

export function getSubcategory(parentSlug: string, subSlug: string): SubcategoryDef | undefined {
  return getSubcategories(parentSlug).find((s) => s.slug === subSlug);
}

/**
 * Resolves which subcategory slug a question belongs to
 */
export function getQuestionSubcategorySlug(dbCategory: string, questionText: string): string | undefined {
  const parentSlug = getCategorySlug(dbCategory);
  if (!parentSlug) return undefined;
  
  const subcategories = subcategoriesByCategory[parentSlug] || [];
  for (const sub of subcategories) {
    // Check dbCategories match
    if (sub.dbCategories && sub.dbCategories.includes(dbCategory)) {
      return sub.slug;
    }
    // Check keywords match
    if (sub.keywords && sub.keywords.length > 0) {
      const lowerText = questionText.toLowerCase();
      if (sub.keywords.some(kw => lowerText.includes(kw.toLowerCase().replace(/[,()]/g, '')))) {
        return sub.slug;
      }
    }
  }
  return undefined;
}