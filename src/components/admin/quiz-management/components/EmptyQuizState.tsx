
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileQuestion, PlusCircle, BookOpen, ImageIcon } from 'lucide-react';

interface EmptyQuizStateProps {
  type: 'text' | 'image';
  hasFilters: boolean;
  onAddQuestion: () => void;
  onLearnTrivia: () => void;
}

const EmptyQuizState: React.FC<EmptyQuizStateProps> = ({
  type,
  hasFilters,
  onAddQuestion,
  onLearnTrivia
}) => {
  return (
    <div className="bg-muted py-10 rounded-md flex flex-col items-center justify-center text-center mt-4">
      {type === 'text' ? (
        <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
      ) : (
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
      )}
      
      <h3 className="text-lg font-medium">
        No {type === 'image' ? 'Image ' : ''}Questions Found
      </h3>
      
      <p className="text-muted-foreground mt-1 mb-4 max-w-md">
        {hasFilters
          ? "Try adjusting your filters to see more results."
          : `Get started by adding some ${type === 'image' ? 'image-based ' : ''}quiz questions.`}
      </p>
      
      <div className="space-x-2">
        <Button 
          onClick={onAddQuestion}
          variant={type === 'image' ? 'default' : 'outline'}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add {type === 'image' ? 'Image ' : 'New '}Question
        </Button>
        <Button 
          onClick={onLearnTrivia}
          variant="outline"
          className="flex items-center gap-1"
        >
          <BookOpen className="h-4 w-4" />
          Learn {type === 'image' ? 'Image ' : ''}Trivia
        </Button>
      </div>
    </div>
  );
};

export default EmptyQuizState;
