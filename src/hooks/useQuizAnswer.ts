
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { QuizQuestion, fetchQuizQuestions } from '@/utils/quizData';
import { getRandomMessage } from '@/utils/funMessages';

export const useQuizAnswer = (questionId: string | undefined, selectedOption: string | undefined) => {
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [funMessage, setFunMessage] = useState('');
  const [funEmoji, setFunEmoji] = useState('');
  const [backgroundClass, setBackgroundClass] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Predefined background classes
  const correctBackgrounds = [
    'bg-correct-1',
    'bg-correct-2',
    'bg-correct-3',
    'bg-correct-4'
  ];
  
  const incorrectBackgrounds = [
    'bg-incorrect-1',
    'bg-incorrect-2',
    'bg-incorrect-3',
    'bg-incorrect-4'
  ];

  useEffect(() => {
    const loadQuestion = async () => {
      // Get all questions
      const questions = await fetchQuizQuestions();
      
      // Find the specific question
      const foundQuestion = questions.find(q => q.id === questionId);
      
      if (foundQuestion) {
        setQuestion(foundQuestion);
        const correct = foundQuestion.correctAnswer === selectedOption;
        setIsCorrect(correct);
        
        // Set fun message based on correctness
        const messageType = correct ? 'success' : 'failure';
        const randomMessage = getRandomMessage(messageType);
        setFunMessage(randomMessage.text);
        setFunEmoji(randomMessage.emoji || '');
        
        // Set random background based on correctness
        if (correct) {
          const randomBg = correctBackgrounds[Math.floor(Math.random() * correctBackgrounds.length)];
          setBackgroundClass(randomBg);
        } else {
          const randomBg = incorrectBackgrounds[Math.floor(Math.random() * incorrectBackgrounds.length)];
          setBackgroundClass(randomBg);
        }
        
        // Show toast with fun message
        setTimeout(() => {
          toast({
            title: correct ? "Great job! 🎉" : "Keep trying! 💪",
            description: randomMessage.text,
            variant: correct ? "default" : "destructive",
          });
        }, 500);
      }
      
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    };
    
    loadQuestion();
  }, [questionId, selectedOption, toast]);

  const handleNextQuestion = () => {
    // Navigate to quiz page
    navigate('/quiz');
  };

  return {
    isLoading,
    question,
    isCorrect,
    funMessage,
    funEmoji,
    backgroundClass,
    handleNextQuestion
  };
};
