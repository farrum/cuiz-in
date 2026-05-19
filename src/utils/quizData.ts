
// This file re-exports everything from the refactored files
// for backwards compatibility
export * from './constants';
export * from './types';
export * from './userUtils';
export * from './quizDataService';
export * from './gemsService';
export * from './adService';

// Constants for point targets
export const DAILY_TARGET = 100;
export const MONTHLY_TARGET = 10000;

// Function to calculate cash amount from gems (gems to INR conversion)
export const calculateCashAmount = (gems: number): number => {
  // Cash amount is half of the gems (2 gems = ₹1)
  return gems / 2;
};
