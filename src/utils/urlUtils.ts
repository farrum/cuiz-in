
/**
import { getCategorySlug } from './categoryMapping';

/**
 * Creates a SEO-friendly URL slug from a string
 * @param text The text to convert to a slug
 * @param maxLength Maximum length of the slug (optional)
 * @returns A URL-safe slug
 */
export const createSlug = (text: string, maxLength?: number): string => {
  if (!text) return '';
  
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  return maxLength ? slug.substring(0, maxLength) : slug;
};

/**
 * Creates a SEO-friendly URL for a quiz question
 * @param id Question ID
 * @param question Question text
 * @param category Category (optional)
 * @param difficulty Difficulty (optional)
 * @returns A URL for the question
 */
export const createQuestionUrl = (
  id: string, 
  question: string,
  category?: string
): string => {
  const slug = createSlug(question, 80);

  if (category) {
    return `/quiz/question/${id}/${getCategorySlug(category)}/${slug}`;
  }

  return `/quiz/question/${id}/${slug}`;
};

/**
 * Creates a SEO-friendly URL for a quiz answer
 * @param questionId Question ID
 * @param selectedOption The selected answer option
 * @returns A URL for the answer
 */
export const createAnswerUrl = (
  questionId: string,
  selectedOption: string
): string => {
  const optionSlug = createSlug(selectedOption);
  return `/answer/${questionId}/${optionSlug}`;
};

/**
 * Creates a SEO-friendly URL for a category
 * @param category Category name
 * @returns A URL for the category
 */
export const createCategoryUrl = (category: string): string => {
  return `/categories/${createSlug(category)}`;
};

/**
 * Extracts question ID from a URL path
 * @param path URL path
 * @returns Question ID or null
 */
export const extractQuestionIdFromUrl = (path: string): string | null => {
  const matches = path.match(/\/quiz\/question\/([^/]+)/);
  return matches ? matches[1] : null;
};
