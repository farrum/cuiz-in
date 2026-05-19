
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { QuizQuestion } from '@/utils/quizData';
import { getRandomMessage } from '@/utils/funMessages';
import { getRandomImageQuizQuestion } from '@/utils/imageQuizUtils';
import { createSlug } from '@/utils/urlUtils';

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
      if (!questionId || !selectedOption) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch the specific question directly by ID (avoids the 1000-row cap)
        let foundQuestion: QuizQuestion | undefined;

        if (!questionId.includes('image-')) {
          const { data: q, error } = await supabase
            .from('quiz_questions')
            .select('id, question, options, category, difficulty, explanation, gems:points, image_url, question_type, created_at')
            .eq('id', questionId)
            .maybeSingle();

          if (!error && q) {
            foundQuestion = {
              id: q.id,
              question: q.question,
              options: Array.isArray(q.options) ? (q.options as string[]) : Object.values(q.options || {}) as string[],
              difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
              category: q.category,
              points: q.points || 10,
              explanation: q.explanation || '',
              imageUrl: q.image_url || undefined,
              questionType: (q.question_type as 'text' | 'image') || 'text',
              createdAt: q.created_at,
              correctAnswer: '',
            };
          }
        }

        // Image questions are generated client-side
        if (!foundQuestion) {
          // For image questions, we need to handle special generated IDs
          if (questionId.includes('image-')) {
            // This is a special case for image questions which might be generated on-the-fly
            const cachedImageQuestions = localStorage.getItem('image_quiz_questions');
            if (cachedImageQuestions) {
              const imageQuestions = JSON.parse(cachedImageQuestions);
              foundQuestion = imageQuestions.find((q: QuizQuestion) => q.id === questionId);
            }
            
            // If still not found, we might need to recreate it (for demo purposes)
            if (!foundQuestion) {
              // This creates a sample image question for demonstration
              foundQuestion = getRandomImageQuizQuestion();
              foundQuestion.id = questionId; // Override with the ID we're looking for
            }
          }
        }
        
        if (foundQuestion) {
          setQuestion(foundQuestion);
          
          // Validate answer server-side
          let correct = false;
          try {
            const { data, error } = await supabase.functions.invoke('validate-quiz-answer', {
              body: { question_id: questionId, selected_answer: selectedOption }
            });
            if (!error && data) {
              correct = data.is_correct;
              foundQuestion.correctAnswer = data.correct_answer;
              foundQuestion.explanation = data.explanation || foundQuestion.explanation;
            }
          } catch (err) {
            console.error('[useQuizAnswer] Server validation error:', err);
            // Fallback to client-side if available
            if (foundQuestion.correctAnswer) {
              const selectedSlug = createSlug(selectedOption || '');
              const correctSlug = createSlug(foundQuestion.correctAnswer);
              correct = selectedSlug === correctSlug || 
                        foundQuestion.correctAnswer.toLowerCase() === (selectedOption || '').toLowerCase();
            }
          }
          
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
        } else {
          console.error("Question not found for ID:", questionId);
        }
      } catch (error) {
        console.error("Error loading question:", error);
      } finally {
        // Simulate loading
        setTimeout(() => {
          setIsLoading(false);
        }, 600);
      }
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
