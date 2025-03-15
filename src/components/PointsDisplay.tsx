
import React, { useState, useEffect } from 'react';
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
  const [cashAmount, setCashAmount] = useState(0);
  
  useEffect(() => {
    const savedPoints = parseFloat(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setPoints(savedPoints);
    setCashAmount(calculateCashAmount(savedPoints));
    
    fetchUserPoints();
  }, []);
  
  const fetchUserPoints = async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) throw error;
        
      if (data && data.points !== null) {
        const newPoints = parseFloat(data.points.toString());
        
        if (animateUpdate && newPoints !== points) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1500);
        }
        
        setPoints(newPoints);
        setCashAmount(calculateCashAmount(newPoints));
        
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, newPoints.toString());
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };
  
  useEffect(() => {
    const handlePointsUpdate = () => {
      fetchUserPoints();
    };
    
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate);
  }, [points, animateUpdate]);

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

export default PointsDisplay;
