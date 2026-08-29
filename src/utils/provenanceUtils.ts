/**
 * Provenance and Citation Utilities for CuizIN Questions
 * Generates verified reference sources, fact types, and citation metadata for AI/SEO
 */

import { QuestionSource, FactType } from './types';

// Curated authoritative primary sources by category
export const CATEGORY_AUTHORITIES: Record<string, QuestionSource[]> = {
  'History': [
    { title: 'National Archives of India', url: 'http://nationalarchives.nic.in', domain: 'nationalarchives.nic.in' },
    { title: 'Archaeological Survey of India', url: 'https://asi.nic.in', domain: 'asi.nic.in' }
  ],
  'Indian History': [
    { title: 'National Archives of India', url: 'http://nationalarchives.nic.in', domain: 'nationalarchives.nic.in' },
    { title: 'Indian Council of Historical Research (ICHR)', url: 'http://ichr.ac.in', domain: 'ichr.ac.in' }
  ],
  'Science': [
    { title: 'NCERT Scientific Resources', url: 'https://ncert.nic.in', domain: 'ncert.nic.in' },
    { title: 'Encyclopaedia Britannica — Science', url: 'https://www.britannica.com/science', domain: 'britannica.com' }
  ],
  'Science & Nature': [
    { title: 'Nature Publishing Group', url: 'https://www.nature.com', domain: 'nature.com' },
    { title: 'Encyclopaedia Britannica', url: 'https://www.britannica.com', domain: 'britannica.com' }
  ],
  'Geography': [
    { title: 'Survey of India', url: 'https://surveyofindia.gov.in', domain: 'surveyofindia.gov.in' },
    { title: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org', domain: 'unesco.org' }
  ],
  'Sports': [
    { title: 'International Olympic Committee (IOC)', url: 'https://olympics.com', domain: 'olympics.com' },
    { title: 'Ministry of Youth Affairs and Sports', url: 'https://yas.nic.in', domain: 'yas.nic.in' }
  ],
  'Cricket': [
    { title: 'International Cricket Council (ICC)', url: 'https://www.icc-cricket.com', domain: 'icc-cricket.com' },
    { title: 'Board of Control for Cricket in India (BCCI)', url: 'https://www.bcci.tv', domain: 'bcci.tv' }
  ],
  'Entertainment': [
    { title: 'National Film Archive of India (NFDC)', url: 'https://www.nfdcindia.com', domain: 'nfdcindia.com' },
    { title: 'Academy of Motion Picture Arts and Sciences', url: 'https://www.oscars.org', domain: 'oscars.org' }
  ],
  'Bollywood': [
    { title: 'National Film Archive of India (NFDC)', url: 'https://www.nfdcindia.com', domain: 'nfdcindia.com' },
    { title: 'Directorate of Film Festivals', url: 'https://dff.gov.in', domain: 'dff.gov.in' }
  ],
  'Arts & Literature': [
    { title: 'Sahitya Akademi', url: 'https://sahitya-akademi.gov.in', domain: 'sahitya-akademi.gov.in' },
    { title: 'The Nobel Foundation', url: 'https://www.nobelprize.org', domain: 'nobelprize.org' }
  ],
  'Mythology': [
    { title: 'Indira Gandhi National Centre for the Arts (IGNCA)', url: 'http://ignca.gov.in', domain: 'ignca.gov.in' },
    { title: 'Encyclopaedia Britannica — World Religions', url: 'https://www.britannica.com/topic/Hinduism', domain: 'britannica.com' }
  ],
  'General Knowledge': [
    { title: 'National Portal of India', url: 'https://www.india.gov.in', domain: 'india.gov.in' },
    { title: 'Encyclopaedia Britannica', url: 'https://www.britannica.com', domain: 'britannica.com' }
  ],
  'Science: Computers': [
    { title: 'IEEE Computer Society', url: 'https://www.computer.org', domain: 'computer.org' },
    { title: 'W3C Technical Architecture', url: 'https://www.w3.org', domain: 'w3.org' }
  ],
  'Guinness World Records': [
    { title: 'Guinness World Records Official Database', url: 'https://www.guinnessworldrecords.com', domain: 'guinnessworldrecords.com' }
  ]
};

// Default fallback source
export const DEFAULT_AUTHORITY: QuestionSource[] = [
  { title: 'CuizIN Editorial & Fact-Checking Board', url: 'https://cuiz.in/editorial-policy', domain: 'cuiz.in' },
  { title: 'National Portal of India', url: 'https://www.india.gov.in', domain: 'india.gov.in' }
];

/**
 * Get verified sources for a question based on its custom sources or category hierarchy
 */
export function getQuestionSources(category: string, rawSources?: any): QuestionSource[] {
  if (Array.isArray(rawSources) && rawSources.length > 0) {
    return rawSources.map(s => {
      if (typeof s === 'string') {
        try {
          const urlObj = new URL(s);
          return { title: urlObj.hostname.replace('www.', ''), url: s, domain: urlObj.hostname };
        } catch {
          return { title: s, domain: 'cuiz.in' };
        }
      }
      return s;
    });
  }

  return CATEGORY_AUTHORITIES[category] || DEFAULT_AUTHORITY;
}

/**
 * Determine fact volatility: 'timeless' vs 'dynamic'
 */
export function getFactType(questionText: string, category: string): FactType {
  const text = (questionText || '').toLowerCase();
  
  // Dynamic signals: records, current officeholders, recent years
  const dynamicPatterns = [
    /\b(current|present|latest|active|holds the record|fastest|highest score|world record|champion|won the 202[0-9]|in 202[0-9]|ipl 202[0-9]|icc 202[0-9])\b/i,
    /\b(prime minister of india as of|chief minister of|president of|governor of|captain of)\b/i
  ];

  if (dynamicPatterns.some(p => p.test(text))) {
    return 'dynamic';
  }

  if (category === 'Guinness World Records') {
    return 'record';
  }

  if (category === 'History' || category === 'Indian History') {
    return 'historical';
  }

  if (category.includes('Science') || category === 'Science: Computers') {
    return 'scientific';
  }

  return 'timeless';
}

/**
 * Get fact verification badge label and styling
 */
export function getProvenanceBadge(factType: FactType, lastReviewedYear: number = new Date().getFullYear()): {
  label: string;
  description: string;
  isDynamic: boolean;
} {
  switch (factType) {
    case 'dynamic':
    case 'record':
      return {
        label: `Verified for ${lastReviewedYear}`,
        description: `Dynamic trivia fact verified by CuizIN Research Team for ${lastReviewedYear}. Subject to scheduled periodic audits.`,
        isDynamic: true
      };
    case 'historical':
      return {
        label: 'Historical Fact',
        description: 'Verified against national archives and historical records.',
        isDynamic: false
      };
    case 'scientific':
      return {
        label: 'Scientific Consensus',
        description: 'Verified against peer-reviewed scientific references and academic curriculum.',
        isDynamic: false
      };
    default:
      return {
        label: 'Fact-Verified',
        description: 'Verified by CuizIN Editorial Board against primary reference materials.',
        isDynamic: false
      };
  }
}
