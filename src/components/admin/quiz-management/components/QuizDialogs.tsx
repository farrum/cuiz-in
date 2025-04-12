
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { QuizQuestion } from '@/utils/quizData';
import QuizQuestionForm from '../QuizQuestionForm';
import ImportQuizQuestions from '../ImportQuizQuestions';
import TriviaImporter from '../TriviaImporter';
import LearnTriviaDialog from '../LearnTriviaDialog';
import { LearnImageTriviaDialog } from '../image-quiz';
import ImageQuizForm from '../ImageQuizForm';

interface QuizDialogsProps {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  isImportDialogOpen: boolean;
  setIsImportDialogOpen: (open: boolean) => void;
  isTriviaBatchDialogOpen: boolean;
  setIsTriviaBatchDialogOpen: (open: boolean) => void;
  isLearnTriviaDialogOpen: boolean;
  setIsLearnTriviaDialogOpen: (open: boolean) => void;
  isLearnImageTriviaDialogOpen: boolean;
  setIsLearnImageTriviaDialogOpen: (open: boolean) => void;
  isImageQuizDialogOpen: boolean;
  setIsImageQuizDialogOpen: (open: boolean) => void;
  currentQuestion: QuizQuestion | null;
  categories: string[];
  handleAddQuestion: (question: Omit<QuizQuestion, 'id'>) => Promise<void>;
  handleUpdateQuestion: (question: QuizQuestion) => Promise<void>;
  fetchQuestions: () => Promise<void>;
}

const QuizDialogs: React.FC<QuizDialogsProps> = ({
  isAddDialogOpen,
  setIsAddDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  isImportDialogOpen,
  setIsImportDialogOpen,
  isTriviaBatchDialogOpen,
  setIsTriviaBatchDialogOpen,
  isLearnTriviaDialogOpen,
  setIsLearnTriviaDialogOpen,
  isLearnImageTriviaDialogOpen,
  setIsLearnImageTriviaDialogOpen,
  isImageQuizDialogOpen,
  setIsImageQuizDialogOpen,
  currentQuestion,
  categories,
  handleAddQuestion,
  handleUpdateQuestion,
  fetchQuestions
}) => {
  return (
    <>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a new quiz question with multiple choice options.
            </DialogDescription>
          </DialogHeader>
          <QuizQuestionForm 
            categories={categories}
            onSubmit={handleAddQuestion}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update the selected quiz question.
            </DialogDescription>
          </DialogHeader>
          {currentQuestion && (
            <QuizQuestionForm 
              initialData={currentQuestion}
              categories={categories}
              onSubmit={handleUpdateQuestion}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Quiz Questions</DialogTitle>
            <DialogDescription>
              Upload an Excel file with quiz questions. 
            </DialogDescription>
          </DialogHeader>
          <ImportQuizQuestions 
            onSuccess={() => {
              fetchQuestions();
              setIsImportDialogOpen(false);
            }}
            onCancel={() => setIsImportDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isImageQuizDialogOpen} onOpenChange={setIsImageQuizDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Image Question</DialogTitle>
            <DialogDescription>
              Create a new image-based quiz question with an image URL.
            </DialogDescription>
          </DialogHeader>
          <ImageQuizForm 
            categories={categories}
            onSuccess={() => {
              fetchQuestions();
              setIsImageQuizDialogOpen(false);
            }}
            onCancel={() => setIsImageQuizDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isLearnTriviaDialogOpen} onOpenChange={setIsLearnTriviaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Learn Trivia Questions</DialogTitle>
            <DialogDescription>
              Import questions from the Open Trivia Database to enhance your quiz.
            </DialogDescription>
          </DialogHeader>
          <LearnTriviaDialog 
            onSuccess={() => {
              fetchQuestions();
              setIsLearnTriviaDialogOpen(false);
            }}
            onCancel={() => setIsLearnTriviaDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isLearnImageTriviaDialogOpen} onOpenChange={setIsLearnImageTriviaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Learn Image Trivia Questions</DialogTitle>
            <DialogDescription>
              Import image-based questions from the Open Trivia Database to enhance your quiz.
            </DialogDescription>
          </DialogHeader>
          <LearnImageTriviaDialog
            onSuccess={() => {
              fetchQuestions();
              setIsLearnImageTriviaDialogOpen(false);
            }}
            onCancel={() => setIsLearnImageTriviaDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuizDialogs;
