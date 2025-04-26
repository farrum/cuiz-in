
import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizAdSync } from './quiz/useQuizAdSync';
import { STORAGE_KEYS } from '@/utils/quizData';

export const useHomePageState = () => {
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  
  const { syncAdSlots } = useQuizAdSync(setForceReloadAds);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const storedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    
    if (userId && storedName) {
      setUserName(storedName);
      setIsLoggedIn(true);
      setHasStarted(true);
    } else if (storedName) {
      // For backwards compatibility with old storage key
      setUserName(storedName);
    }
    
    // Sync ad slots when component mounts
    syncAdSlots();
  }, []);

  const handleStartClick = () => {
    setHasStarted(true);
    if (!userName && !isLoggedIn) {
      setShowNameInput(true);
    } else {
      navigateToRegister();
    }
  };

  // Add this event handler to properly handle input changes
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('quiz_app_user_name', userName);
      navigateToRegister();
    }
  };

  const navigateToRegister = () => {
    if (isLoggedIn) {
      navigate('/quiz');
    } else {
      navigate('/register');
    }
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  const navigateToProfile = () => {
    navigate('/profile');
  };

  return {
    userName,
    hasStarted,
    showNameInput,
    forceReloadAds,
    isLoggedIn,
    setUserName: handleNameChange, // Return the event handler function instead of the raw setter
    handleStartClick,
    navigateToRegister,
    navigateToLogin,
    navigateToProfile,
    handleNameSubmit,
    syncAdSlots
  };
};
