
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GameMode, GameModeConfig } from '@/utils/types';

const GAME_MODE_STORAGE_KEY = 'quiz_game_mode';

// Default configurations for different game modes
export const GAME_MODE_CONFIGS: Record<GameMode, GameModeConfig> = {
  'normal': {
    name: 'Normal Mode',
    description: 'Standard quiz with no time pressure',
    icon: 'brain',
  },
  'time-attack': {
    name: 'Time Attack',
    description: 'Answer as many questions as possible within the time limit',
    icon: 'timer',
    timeLimit: 60, // 60 seconds
  },
  'team-quiz': {
    name: 'Team Quiz',
    description: 'Collaborate with team members to earn points together',
    icon: 'users',
    teamSize: 2,
  },
  'streak': {
    name: 'Streak Mode',
    description: 'Build your streak for increasing point bonuses',
    icon: 'zap',
    streakMultiplier: 0.5, // 50% bonus per streak level
  }
};

export const useGameMode = () => {
  const [currentMode, setCurrentMode] = useState<GameMode>('normal');
  const [config, setConfig] = useState<GameModeConfig>(GAME_MODE_CONFIGS['normal']);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { toast } = useToast();

  // Initialize from storage
  useEffect(() => {
    const storedMode = localStorage.getItem(GAME_MODE_STORAGE_KEY) as GameMode | null;
    if (storedMode && GAME_MODE_CONFIGS[storedMode]) {
      setCurrentMode(storedMode);
      setConfig(GAME_MODE_CONFIGS[storedMode]);
      
      // Initialize timer for time-attack mode
      if (storedMode === 'time-attack' && GAME_MODE_CONFIGS[storedMode].timeLimit) {
        setTimeRemaining(GAME_MODE_CONFIGS[storedMode].timeLimit);
      }
    }
  }, []);

  // Handle changing the game mode
  const changeGameMode = (mode: GameMode) => {
    if (GAME_MODE_CONFIGS[mode]) {
      setCurrentMode(mode);
      setConfig(GAME_MODE_CONFIGS[mode]);
      localStorage.setItem(GAME_MODE_STORAGE_KEY, mode);
      
      // Initialize timer for time-attack mode
      if (mode === 'time-attack' && GAME_MODE_CONFIGS[mode].timeLimit) {
        setTimeRemaining(GAME_MODE_CONFIGS[mode].timeLimit);
      } else {
        setTimeRemaining(null);
      }
      
      toast({
        title: `Switched to ${GAME_MODE_CONFIGS[mode].name}`,
        description: GAME_MODE_CONFIGS[mode].description,
      });
    }
  };

  // Calculate points based on game mode
  const calculatePoints = (basePoints: number, isCorrect: boolean, currentStreak: number) => {
    if (!isCorrect) return 0.5; // Always give 0.5 points for wrong answers
    
    let finalPoints = basePoints;
    
    // Apply streak multiplier in streak mode
    if (currentMode === 'streak' && config.streakMultiplier) {
      const streakBonus = Math.floor(currentStreak * config.streakMultiplier);
      finalPoints += streakBonus;
    }
    
    // In time attack mode, faster answers get more points (implemented elsewhere with timer)
    
    return finalPoints;
  };

  return {
    currentMode,
    config,
    timeRemaining,
    setTimeRemaining,
    changeGameMode,
    calculatePoints,
    allModes: Object.keys(GAME_MODE_CONFIGS) as GameMode[],
    modeConfigs: GAME_MODE_CONFIGS
  };
};
