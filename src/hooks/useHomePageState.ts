
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from '@/utils/quizData';

export const useHomePageState = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  
  useEffect(() => {
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (name) {
      setUserName(name);
      setHasStarted(true);
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode && !localStorage.getItem(`ref_used_${refCode}`)) {
      localStorage.setItem(`ref_used_${refCode}`, 'true');
      const currentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, (currentPoints + 10).toString());
      
      setTimeout(() => {
        toast({
          title: "Welcome Bonus! 🎁",
          description: "You received 10 points for using a referral link!"
        });
      }, 1000);
    }
  }, [toast]);
  
  const handleStartClick = () => {
    if (userName) {
      navigate('/quiz');
    } else {
      navigate('/register');
    }
  };
  
  const navigateToRegister = () => navigate('/register');
  const navigateToLogin = () => navigate('/login');
  const navigateToProfile = () => navigate('/profile');
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };
  
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, userName);
      if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, '0');
      }
      setHasStarted(true);
      setShowNameInput(false);
      setTimeout(() => {
        navigate('/quiz');
      }, 500);
    }
  };
  
  return {
    userName,
    hasStarted,
    showNameInput,
    setUserName: handleNameChange,
    setShowNameInput,
    handleStartClick,
    navigateToRegister,
    navigateToLogin,
    navigateToProfile,
    handleNameSubmit
  };
};
