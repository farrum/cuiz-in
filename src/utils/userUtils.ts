
import { STORAGE_KEYS } from './constants';

// Get user ID from storage
export const getUserId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.USER_ID);
};

// Calculate cash amount from points
export const calculateCashAmount = (points: number): number => {
  // 2 points = ₹1
  return points / 2;
};
