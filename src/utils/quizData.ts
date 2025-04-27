
// This file re-exports everything from the refactored files
// for backwards compatibility
export * from './constants';
export * from './types';
export * from './userUtils';
export * from './quizDataService';
export * from './pointsService';
export * from './adService';

// Constants for point targets
export const DAILY_TARGET = 100;
export const MONTHLY_TARGET = 10000;

// Function to calculate cash amount from points (points to INR conversion)
export const calculateCashAmount = (points: number): number => {
  // Cash amount is half of the points (2 points = ₹1)
  return points / 2;
};
