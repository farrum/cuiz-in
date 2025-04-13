
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import QuestionItem from './QuestionItem';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { useQuizHistory } from './useQuizHistory';
import { RecentlyAnsweredQuestionsProps } from './types';

const RecentlyAnsweredQuestions: React.FC<RecentlyAnsweredQuestionsProps> = ({ 
  userId,
  limit = 5
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { 
    answeredQuestions, 
    isLoading, 
    totalPages 
  } = useQuizHistory(userId, currentPage, limit);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (answeredQuestions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {answeredQuestions.map(question => (
        <QuestionItem key={question.id} question={question} />
      ))}
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecentlyAnsweredQuestions;
