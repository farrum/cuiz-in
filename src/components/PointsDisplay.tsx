
import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS, calculateCashAmount } from '../utils/quizData';
import { IndianRupee } from 'lucide-react';

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
    const savedPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setPoints(savedPoints);
    setCashAmount(calculateCashAmount(savedPoints));
  }, []);
  
  // Listen for points updates
  useEffect(() => {
    const handlePointsUpdate = () => {
      const newPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
      
      if (animateUpdate && newPoints !== points) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1500);
      }
      
      setPoints(newPoints);
      setCashAmount(calculateCashAmount(newPoints));
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
          <span>{points}</span>
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
