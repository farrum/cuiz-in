/**
 * Guest play service - tracks anonymous users' quiz attempts
 * Allows 30 free questions per day before requiring registration
 * Resets daily for returning guests
 */

import { STORAGE_KEYS } from './constants';

const GUEST_PLAY_KEY = 'cuizin_guest_play';
const GUEST_MILESTONES_KEY = 'cuizin_guest_milestones';
const MAX_GUEST_QUESTIONS = 30;

interface GuestPlayData {
  questionsPlayed: number;
  sessionPoints: number;
  lastReset: string;
}

interface GuestMilestones {
  celebratedMilestones: number[];
}

const getDefaultGuestData = (): GuestPlayData => ({
  questionsPlayed: 0,
  sessionPoints: 0,
  lastReset: new Date().toISOString(),
});

const getDefaultMilestones = (): GuestMilestones => ({
  celebratedMilestones: [],
});

/**
 * Get current guest play data from localStorage
 */
export const getGuestPlayData = (): GuestPlayData => {
  try {
    const stored = localStorage.getItem(GUEST_PLAY_KEY);
    if (!stored) return getDefaultGuestData();
    
    const data = JSON.parse(stored) as GuestPlayData;
    
    // Reset if data is more than 24 hours old
    const lastReset = new Date(data.lastReset);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceReset > 24) {
      return getDefaultGuestData();
    }
    
    return data;
  } catch {
    return getDefaultGuestData();
  }
};

/**
 * Check if the user is logged in
 */
export const isUserLoggedIn = (): boolean => {
  // Check both the canonical app user id and any legacy key for safety.
  const userId =
    localStorage.getItem(STORAGE_KEYS.USER_ID) ||
    localStorage.getItem('cuizin_user_id');
  if (userId && userId.length > 0) return true;

  // Fallback: detect an active Supabase auth session from its localStorage entry.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw && raw.includes('access_token')) return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
};

/**
 * Check if guest can play more questions
 */
export const canGuestPlay = (): boolean => {
  // Always allow logged-in users
  if (isUserLoggedIn()) return true;
  
  const data = getGuestPlayData();
  return data.questionsPlayed < MAX_GUEST_QUESTIONS;
};

/**
 * Get remaining guest plays
 */
export const getRemainingGuestPlays = (): number => {
  if (isUserLoggedIn()) return -1; // Unlimited for logged-in users
  
  const data = getGuestPlayData();
  return Math.max(0, MAX_GUEST_QUESTIONS - data.questionsPlayed);
};

/**
 * Get guest session points (for display before registration)
 */
export const getGuestSessionPoints = (): number => {
  const data = getGuestPlayData();
  return data.sessionPoints;
};

/**
 * Increment guest play count and add points
 */
export const incrementGuestPlay = (pointsEarned: number = 0): void => {
  if (isUserLoggedIn()) return; // Don't track for logged-in users
  
  const data = getGuestPlayData();
  data.questionsPlayed += 1;
  data.sessionPoints += pointsEarned;
  
  localStorage.setItem(GUEST_PLAY_KEY, JSON.stringify(data));
  
  // Dispatch event for registration incentive modal
  window.dispatchEvent(new CustomEvent('guestQuestionCompleted', {
    detail: { questionsPlayed: data.questionsPlayed, sessionPoints: data.sessionPoints }
  }));
};

/**
 * Reset guest play data (e.g., after registration)
 */
export const resetGuestPlayData = (): void => {
  localStorage.removeItem(GUEST_PLAY_KEY);
};

/**
 * Get max allowed guest questions
 */
export const getMaxGuestQuestions = (): number => {
  return MAX_GUEST_QUESTIONS;
};

/**
 * Get guest questions played count
 */
export const getGuestQuestionsPlayed = (): number => {
  const data = getGuestPlayData();
  return data.questionsPlayed;
};

/**
 * Get time until next reset (in milliseconds)
 */
export const getTimeUntilReset = (): number => {
  const data = getGuestPlayData();
  const lastReset = new Date(data.lastReset);
  const resetTime = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, resetTime.getTime() - now.getTime());
};

/**
 * Get the next reset date/time
 */
export const getNextResetTime = (): Date => {
  const data = getGuestPlayData();
  const lastReset = new Date(data.lastReset);
  return new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);
};

/**
 * Point milestones for celebrations
 */
export const POINT_MILESTONES = [50, 100, 200, 500] as const;

/**
 * Get celebrated milestones from localStorage
 */
export const getCelebratedMilestones = (): number[] => {
  try {
    const stored = localStorage.getItem(GUEST_MILESTONES_KEY);
    if (!stored) return [];
    const data = JSON.parse(stored) as GuestMilestones;
    return data.celebratedMilestones;
  } catch {
    return [];
  }
};

/**
 * Mark a milestone as celebrated
 */
export const markMilestoneCelebrated = (milestone: number): void => {
  const celebrated = getCelebratedMilestones();
  if (!celebrated.includes(milestone)) {
    celebrated.push(milestone);
    localStorage.setItem(GUEST_MILESTONES_KEY, JSON.stringify({ celebratedMilestones: celebrated }));
  }
};

/**
 * Check if there's a new milestone to celebrate
 */
export const getUncelabratedMilestone = (): number | null => {
  if (isUserLoggedIn()) return null;
  
  const sessionPoints = getGuestSessionPoints();
  const celebrated = getCelebratedMilestones();
  
  for (const milestone of POINT_MILESTONES) {
    if (sessionPoints >= milestone && !celebrated.includes(milestone)) {
      return milestone;
    }
  }
  return null;
};

/**
 * Reset milestones (e.g., after registration or daily reset)
 */
export const resetMilestones = (): void => {
  localStorage.removeItem(GUEST_MILESTONES_KEY);
};
