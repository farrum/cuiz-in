
import React, { useState } from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { RecentlyAnsweredQuestionsProps } from './types';
import { useQuizHistory } from './useQuizHistory';
import QuestionItem from './QuestionItem';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

const RecentlyAnsweredQuestions: React.FC<RecentlyAnsweredQuestionsProps> = ({ 
  userId, 
  limit = 5 
}) => {
  const [page, setPage] = useState(1);
  const { answeredQuestions, isLoading, totalPages } = useQuizHistory(userId, page, limit);

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
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  isActive={page === i + 1} 
                  onClick={() => setPage(i + 1)}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default React.memo(RecentlyAnsweredQuestions);
