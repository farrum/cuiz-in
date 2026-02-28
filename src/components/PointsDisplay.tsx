import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS } from '../utils/quizData';
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
  
  const handlePointsUpdate = useCallback(() => {
    console.log('Points update event received in PointsDisplay');
    fetchUserPoints();
  }, [fetchUserPoints]);
  
  useEffect(() => {
    const savedPoints = parseFloat(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setPoints(savedPoints);
    
    fetchUserPoints();
    
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    
    const intervalId = setInterval(fetchUserPoints, 30000);
    
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
      clearInterval(intervalId);
    };
  }, [fetchUserPoints, handlePointsUpdate]);

  const cashAmount = useMemo(() => {
    const inrAmount = calculateCashAmount(points);
    return inrAmount * currencyDisplay.exchangeRate;
  }, [points, currencyDisplay.exchangeRate]);

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
          {currencyDisplay.symbol === '₹' ? (
            <IndianRupee className="w-4 h-4 mr-1" />
          ) : (
            <DollarSign className="w-4 h-4 mr-1" />
          )}
          <span>{currencyDisplay.symbol}{cashAmount.toFixed(2)} available</span>
        </div>

        {!currencyDisplay.isIndian && !localStorage.getItem(STORAGE_KEYS.USER_ID) && (
          <Button 
            variant="default" 
            size="sm" 
            className="mt-4 bg-primary text-white hover:bg-primary/90"
            onClick={() => navigate('/register')}
          >
            Register to Start Earning
          </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(PointsDisplay);
