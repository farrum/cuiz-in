
import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizAdSync } from './quiz/useQuizAdSync';

export const useHomePageState = () => {
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const navigate = useNavigate();
  
  const { syncAdSlots } = useQuizAdSync(setForceReloadAds);

  useEffect(() => {
    // Load user name from localStorage if exists
    const storedName = localStorage.getItem('quiz_app_user_name');
    if (storedName) {
      setUserName(storedName);
    }
    
    // Sync ad slots when component mounts
    syncAdSlots();
  }, []);

  const handleStartClick = () => {
    setHasStarted(true);
    if (!userName) {
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
    navigate('/register');
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
    setUserName: handleNameChange, // Return the event handler function instead of the raw setter
    handleStartClick,
    navigateToRegister,
    navigateToLogin,
    navigateToProfile,
    handleNameSubmit,
    syncAdSlots
  };
};
