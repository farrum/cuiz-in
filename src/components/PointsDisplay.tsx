
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, calculateCashAmount } from '../utils/quizData';
import { IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PointsDisplayProps {
  animateUpdate?: boolean;
  className?: string;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ 
  animateUpdate = false,
  className = ""
}) => {
  const [points, setPoints] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Use useMemo to calculate cash amount only when points change
  const cashAmount = useMemo(() => calculateCashAmount(points), [points]);
  
  // Optimize fetch user points function with useCallback
  const fetchUserPoints = useCallback(async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching user points:', error);
        return;
      }
        
      if (data && data.points !== null) {
        const newPoints = parseFloat(data.points.toString());
        
        if (animateUpdate && newPoints !== points) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1500);
        }
        
        setPoints(newPoints);
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, newPoints.toString());
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  }, [animateUpdate, points]);
  
  // Handle points updates more efficiently
  const handlePointsUpdate = useCallback(() => {
    console.log('Points update event received in PointsDisplay');
    fetchUserPoints();
  }, [fetchUserPoints]);
  
  useEffect(() => {
    // Load initial points from localStorage
    const savedPoints = parseFloat(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setPoints(savedPoints);
    
    // Fetch user points from the database - once on initial load
    fetchUserPoints();
    
    // Set up listener for point updates
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    
    // Use a more efficient interval to prevent excessive database calls
    // 10 seconds is quite frequent for point updates, increasing to 30 seconds
    const intervalId = setInterval(fetchUserPoints, 30000);
    
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
      clearInterval(intervalId);
    };
  }, [fetchUserPoints, handlePointsUpdate]);

  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="flex flex-col items-center">
        <h4 className="text-sm text-muted-foreground mb-1">Your Balance</h4>
        
        <div className={`text-3xl font-bold flex items-center transition-all duration-300 ${
          isAnimating ? 'scale-110 text-primary' : ''
        }`}>
          <span>{points.toFixed(1)}</span>
          <span className="ml-1 text-sm text-muted-foreground">pts</span>
        </div>
        
        <div className="mt-2 flex items-center text-sm text-muted-foreground">
          <IndianRupee className="w-4 h-4 mr-1" />
          <span>₹{cashAmount.toFixed(2)} available</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PointsDisplay);
