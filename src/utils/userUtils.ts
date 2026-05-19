
import { STORAGE_KEYS } from './constants';

// Get user ID from storage
export const getUserId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.USER_ID);
};

// Calculate cash amount from gems
export const calculateCashAmount = (gems: number): number => {
  // 2 gems = ₹1
  return gems / 2;
};
