
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useQuizMotivation = (questionsAnswered: number) => {
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');
  const { toast } = useToast();

  const showMotivationalMessage = () => {
    if (questionsAnswered > 0 && questionsAnswered % 3 === 0) {
      const motivationalMessages = [
        "You're doing great! Keep going!",
        "Your brain is getting stronger with every question!",
        "You're on a roll! Can you answer a few more?",
        "Learning is an adventure, and you're acing it!",
        "Keep up this momentum! You're amazing!"
      ];
      
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMotivationMessage(randomMessage);
      setShowMotivation(true);
      
      setTimeout(() => {
        setShowMotivation(false);
      }, 5000);
    }
  };
  
  // Watch for streak milestones
  useEffect(() => {
    if (questionsAnswered > 0 && questionsAnswered % 5 === 0) {
      toast({
        title: `${questionsAnswered} Questions Answered!`,
        description: "Keep up the great work!",
      });
    }
  }, [questionsAnswered, toast]);

  return {
    showMotivation,
    motivationMessage,
    setShowMotivation,
    setMotivationMessage,
    showMotivationalMessage
  };
};
