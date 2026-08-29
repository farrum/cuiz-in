/**
 * Utility functions for question normalization, query variations, 
 * Knowledge Claim IDs, and fact verification timestamps.
 */

/**
 * Deterministically generates natural-language query variants for common trivia formats.
 * Used for AI query normalization, search equivalence, and Schema.org alternateName.
 */
export function generateQuestionVariants(questionText: string, category?: string): string[] {
  if (!questionText || typeof questionText !== 'string') return [];

  const raw = questionText.trim().replace(/[.?]+$/, '');
  const variants: string[] = [];

  // Pattern: "Who was the first X of Y?" -> "Who became Y's first X?", "First X of Y"
  if (/^who was the first\s+(.+?)\s+of\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^who was the first\s+(.+?)\s+of\s+(.+)$/i);
    if (match) {
      const [, role, entity] = match;
      variants.push(`Who became the first ${role} of ${entity}?`);
      variants.push(`First ${role} of ${entity}`);
      variants.push(`Who was ${entity}'s first ${role}?`);
    }
  }
  // Pattern: "Who was the X of Y?" -> "Who served as the X of Y?", "Who was Y's X?"
  else if (/^who was the\s+(.+?)\s+of\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^who was the\s+(.+?)\s+of\s+(.+)$/i);
    if (match) {
      const [, role, entity] = match;
      variants.push(`Who served as the ${role} of ${entity}?`);
      variants.push(`Who was ${entity}'s ${role}?`);
    }
  }
  // Pattern: "What is the capital of X?" -> "Which city is the capital of X?", "Capital city of X"
  else if (/^what is the capital of\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^what is the capital of\s+(.+)$/i);
    if (match) {
      const [, place] = match;
      variants.push(`Which city is the capital of ${place}?`);
      variants.push(`Capital city of ${place}`);
      variants.push(`What is ${place}'s capital city?`);
    }
  }
  // Pattern: "When did X happen?" -> "In what year did X happen?", "Date of X"
  else if (/^when did\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^when did\s+(.+)$/i);
    if (match) {
      const [, event] = match;
      variants.push(`In what year did ${event}?`);
      variants.push(`What date did ${event}?`);
    }
  }
  // Pattern: "Which is the largest / smallest / highest / fastest X?"
  else if (/^which is the\s+(largest|smallest|highest|fastest|longest|deepest|oldest|hottest|coldest)\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^which is the\s+(largest|smallest|highest|fastest|longest|deepest|oldest|hottest|coldest)\s+(.+)$/i);
    if (match) {
      const [, superlative, object] = match;
      variants.push(`What is the ${superlative} ${object}?`);
      variants.push(`Record for ${superlative} ${object}`);
    }
  }
  // Pattern: "Who invented / discovered / wrote / painted X?"
  else if (/^who (invented|discovered|wrote|painted|directed|composed)\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^who (invented|discovered|wrote|painted|directed|composed)\s+(.+)$/i);
    if (match) {
      const [, verb, subject] = match;
      const nounMap: Record<string, string> = {
        invented: 'inventor of',
        discovered: 'discoverer of',
        wrote: 'author of',
        painted: 'painter of',
        directed: 'director of',
        composed: 'composer of'
      };
      const noun = nounMap[verb.toLowerCase()] || `creator of`;
      variants.push(`Who was the ${noun} ${subject}?`);
      variants.push(`${subject} was ${verb} by who?`);
    }
  }
  // Pattern: "What is the name of X?"
  else if (/^what is the name of\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^what is the name of\s+(.+)$/i);
    if (match) {
      const [, subject] = match;
      variants.push(`What is ${subject} called?`);
    }
  }

  // Generic fallback if no specific pattern matched
  if (variants.length === 0) {
    if (raw.toLowerCase().startsWith('which ')) {
      variants.push(raw.replace(/^which /i, 'What ') + '?');
    } else if (raw.toLowerCase().startsWith('what ')) {
      variants.push(raw.replace(/^what /i, 'Which ') + '?');
    }
  }

  // Deduplicate and filter out identical text
  const cleanList = Array.from(new Set(variants))
    .filter(v => v.toLowerCase() !== raw.toLowerCase())
    .slice(0, 3);

  return cleanList;
}

/**
 * Generates a stable Knowledge Claim ID for indexing and citation referencing.
 */
export function getKnowledgeClaimId(questionId: string): string {
  if (!questionId) return 'CUIZ-CLAIM-GEN';
  const prefix = questionId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `CUIZ-FACT-${prefix}`;
}

/**
 * Returns formatted fact review metadata.
 */
export function getFactReviewMetadata(createdAt?: string) {
  const dateObj = createdAt ? new Date(createdAt) : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const currentYear = new Date().getFullYear();
  
  // Format as "August 2026" or current year
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentMonth = monthNames[new Date().getMonth()];
  const formattedReviewDate = `${currentMonth} ${currentYear}`;
  const isoModifiedDate = new Date().toISOString().split('T')[0];

  return {
    claimId: '',
    verifiedDate: formattedReviewDate,
    isoModifiedDate: `${isoModifiedDate}T00:00:00Z`
  };
}
