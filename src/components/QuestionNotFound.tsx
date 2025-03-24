
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const QuestionNotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="quiz-card text-center">
      <p>Question not found. Please try again.</p>
      <Button onClick={() => navigate('/quiz')} className="mt-4">
        Back to Quiz
      </Button>
    </div>
  );
};

export default QuestionNotFound;
