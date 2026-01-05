/**
 * Guest play service - tracks anonymous users' quiz attempts
 * Allows 10 free questions before requiring registration
 */

const GUEST_PLAY_KEY = 'cuizin_guest_play';
const MAX_GUEST_QUESTIONS = 10;

interface GuestPlayData {
  questionsPlayed: number;
  sessionPoints: number;
  lastReset: string;
}

const getDefaultGuestData = (): GuestPlayData => ({
  questionsPlayed: 0,
  sessionPoints: 0,
  lastReset: new Date().toISOString(),
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
  const userId = localStorage.getItem('cuizin_user_id');
  return !!userId && userId.length > 0;
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
