import React, { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/quizData';
import { supabase } from '@/integrations/supabase/client';

interface GemsDisplayProps {
  animateUpdate?: boolean;
  className?: string;
}

const GemsDisplay: React.FC<GemsDisplayProps> = ({ 
  animateUpdate = false,
  className = ""
}) => {
  const [gems, setGems] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const fetchUserGems = useCallback(async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('gems')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching user gems:', error);
        return;
      }
        
      if (data && data.gems !== null) {
        const newGems = parseFloat(data.gems.toString());
        
        if (animateUpdate && newGems !== gems) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1500);
        }
        
        setGems(newGems);
        localStorage.setItem(STORAGE_KEYS.USER_GEMS, newGems.toString());
      }
    } catch (error) {
      console.error('Error fetching user gems:', error);
    }
  }, [animateUpdate, gems]);
  
  const handleGemsUpdate = useCallback(() => {
    console.log('Gems update event received in GemsDisplay');
    fetchUserGems();
  }, [fetchUserGems]);
  
  useEffect(() => {
    const savedGems = parseFloat(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0');
    setGems(savedGems);
    
    fetchUserGems();
    
    window.addEventListener('gemsUpdated', handleGemsUpdate);
    
    const intervalId = setInterval(fetchUserGems, 30000);
    
    return () => {
      window.removeEventListener('gemsUpdated', handleGemsUpdate);
      clearInterval(intervalId);
    };
  }, [fetchUserGems, handleGemsUpdate]);

  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="flex flex-col items-center">
        <h4 className="text-sm text-muted-foreground mb-1">Your Gems</h4>
        
        <div className={`text-3xl font-bold flex items-center transition-all duration-300 ${
          isAnimating ? 'scale-110 text-primary' : ''
        }`}>
          <span>{gems.toFixed(1)}</span>
          <span className="ml-1 text-sm text-muted-foreground">pts</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GemsDisplay);
