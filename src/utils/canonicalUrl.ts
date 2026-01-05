
/**
 * Canonical URL utility for SEO
 * Generates consistent canonical URLs to prevent duplicate content issues
 */

import { createSlug } from './urlUtils';
import { getCategorySlug } from './categoryMapping';

const SITE_URL = 'https://cuiz.in';

export interface CanonicalUrlOptions {
  questionId?: string;
  questionText?: string;
  category?: string;
  faqId?: string;
  faqQuestion?: string;
  blogSlug?: string;
  path?: string;
}

/**
 * Generate the canonical URL for any page
 * This ensures consistency across all URL variations
 */
export const generateCanonicalUrl = (options: CanonicalUrlOptions): string => {
  const { questionId, questionText, category, faqId, faqQuestion, blogSlug, path } = options;

  // Question page canonical URL
  if (questionId && questionText) {
    const questionSlug = createSlug(questionText, 80);
    return `${SITE_URL}/quiz/question/${questionId}/${questionSlug}`;
  }

  // Category page canonical URL
  if (category) {
    const categorySlug = getCategorySlug(category);
    return `${SITE_URL}/categories/${categorySlug}`;
  }

  // FAQ page canonical URL
  if (faqId && faqQuestion) {
    const faqSlug = createSlug(faqQuestion, 80);
    return `${SITE_URL}/faq/${faqId}/${faqSlug}`;
  }

  // Blog post canonical URL
  if (blogSlug) {
    return `${SITE_URL}/blog/${blogSlug}`;
  }

  // Generic path canonical URL
  if (path) {
    // Remove trailing slash and ensure leading slash
    const cleanPath = path.replace(/\/+$/, '').replace(/^([^/])/, '/$1');
    return `${SITE_URL}${cleanPath}`;
  }

  return SITE_URL;
};

/**
 * Generate dynamic Open Graph image URL for a question
 * Uses edge function to create custom images with category, difficulty, and question text
 */
export const generateOgImageUrl = (options: {
  type: 'question' | 'category' | 'blog' | 'default';
  title?: string;
  category?: string;
  difficulty?: string;
}): string => {
  const { type, title, category, difficulty } = options;

  const OG_FUNCTION_URL = 'https://pgywvtphfidouakypdno.supabase.co/functions/v1/og-image';
  const baseOgUrl = `${SITE_URL}/og-image.png`;

  // Generate dynamic OG image for questions
  if (type === 'question' && title && category) {
    const categorySlug = getCategorySlug(category);
    const params = new URLSearchParams({
      title: title.substring(0, 120),
      category: categorySlug,
      difficulty: difficulty || 'medium'
    });
    return `${OG_FUNCTION_URL}?${params.toString()}`;
  }

  // Generate dynamic OG image for categories
  if (type === 'category' && category) {
    const categorySlug = getCategorySlug(category);
    const params = new URLSearchParams({
      title: `${category} Quiz - Test Your Knowledge`,
      category: categorySlug,
      difficulty: 'mixed'
    });
    return `${OG_FUNCTION_URL}?${params.toString()}`;
  }

  return baseOgUrl;
};

/**
 * Generate social sharing metadata for a question
 */
export const generateQuestionSocialMeta = (question: {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  options: string[];
}) => {
  const canonicalUrl = generateCanonicalUrl({
    questionId: question.id,
    questionText: question.question
  });

  const title = `${question.question.substring(0, 60)}${question.question.length > 60 ? '...' : ''} | CuizIN Quiz`;
  
  const description = `Test your ${question.category} knowledge! ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)} level quiz question. Play free and earn rewards at CuizIN.`;

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'article' as const,
    ogImage: generateOgImageUrl({
      type: 'question',
      title: question.question,
      category: question.category,
      difficulty: question.difficulty
    }),
    twitterCard: 'summary_large_image' as const,
    keywords: [
      question.category.toLowerCase(),
      question.difficulty,
      'quiz',
      'trivia',
      'free quiz',
      'earn rewards',
      ...question.options.slice(0, 2).map(o => o.toLowerCase().substring(0, 20))
    ]
  };
};

/**
 * Generate social sharing metadata for a category
 */
export const generateCategorySocialMeta = (categoryName: string, categorySlug: string) => {
  const canonicalUrl = `${SITE_URL}/categories/${categorySlug}`;
  
  const title = `${categoryName} Quiz Questions | CuizIN - Free Trivia Game`;
  const description = `Play free ${categoryName} quiz questions and test your knowledge. Earn points, compete on leaderboards, and win rewards at CuizIN!`;

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'website' as const,
    ogImage: generateOgImageUrl({ type: 'category', category: categoryName }),
    keywords: [
      categoryName.toLowerCase(),
      `${categoryName.toLowerCase()} quiz`,
      `${categoryName.toLowerCase()} trivia`,
      'free quiz',
      'trivia game',
      'quiz game'
    ]
  };
};
