
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { QuizQuestion } from '@/utils/quizData';
import * as XLSX from 'xlsx';

export const useQuizActions = (
  fetchQuestions: () => Promise<void>,
  categories: string[]
) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [isTriviaBatchDialogOpen, setIsTriviaBatchDialogOpen] = useState(false);
  const [isLearnTriviaDialogOpen, setIsLearnTriviaDialogOpen] = useState(false);
  const [isLearnImageTriviaDialogOpen, setIsLearnImageTriviaDialogOpen] = useState(false);
  const [isImageQuizDialogOpen, setIsImageQuizDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddQuestion = async (question: Omit<QuizQuestion, 'id'>) => {
    try {
      console.log("Adding question:", question);
      
      const options = Array.isArray(question.options) 
        ? question.options.filter(opt => opt.trim() !== '') 
        : [];
      
      if (options.length < 2) {
        throw new Error("At least 2 options are required");
      }

      if (!question.correctAnswer) {
        throw new Error("Correct answer is required");
      }
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert({
          question: question.question,
          options: options,
          correct_answer: question.correctAnswer,
          difficulty: question.difficulty,
          category: question.category,
          explanation: question.explanation || '',
          question_type: 'text'
        })
        .select();
        
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Question added successfully!",
      });
      
      fetchQuestions();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add question. " + (error instanceof Error ? error.message : ""),
        variant: "destructive"
      });
    }
  };

  const handleUpdateQuestion = async (question: QuizQuestion) => {
    try {
      const options = Array.isArray(question.options) 
        ? question.options.filter(opt => opt.trim() !== '') 
        : [];
      
      if (options.length < 2) {
        throw new Error("At least 2 options are required");
      }

      if (!question.correctAnswer) {
        throw new Error("Correct answer is required");
      }
      
      const { error } = await supabase
        .from('quiz_questions')
        .update({
          question: question.question,
          options: options,
          correct_answer: question.correctAnswer,
          difficulty: question.difficulty,
          category: question.category,
          explanation: question.explanation || ''
        })
        .eq('id', question.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Question updated successfully!",
      });
      
      fetchQuestions();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question. " + (error instanceof Error ? error.message : ""),
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        const { error } = await supabase
          .from('quiz_questions')
          .delete()
          .eq('id', id);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Question deleted successfully!",
        });
        
        fetchQuestions();
      } catch (error) {
        console.error('Error deleting question:', error);
        toast({
          title: "Error",
          description: "Failed to delete question.",
          variant: "destructive"
        });
      }
    }
  };

  const exportToExcel = (activeTab: string, questions: QuizQuestion[]) => {
    const worksheet = XLSX.utils.json_to_sheet(
      questions.map(q => ({
        Question: q.question,
        Options: q.options.join('|'),
        CorrectAnswer: q.correctAnswer,
        Category: q.category,
        Difficulty: q.difficulty,
        Explanation: q.explanation || '',
        ImageURL: q.imageUrl || ''
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Quiz Questions`);
    XLSX.writeFile(workbook, `${activeTab}_quiz_questions.xlsx`);
    
    toast({
      title: "Success",
      description: "Questions exported to Excel.",
    });
  };

  return {
    isAddDialogOpen, 
    setIsAddDialogOpen,
    isEditDialogOpen, 
    setIsEditDialogOpen,
    isImportDialogOpen, 
    setIsImportDialogOpen,
    currentQuestion, 
    setCurrentQuestion,
    isTriviaBatchDialogOpen, 
    setIsTriviaBatchDialogOpen,
    isLearnTriviaDialogOpen, 
    setIsLearnTriviaDialogOpen,
    isLearnImageTriviaDialogOpen, 
    setIsLearnImageTriviaDialogOpen,
    isImageQuizDialogOpen, 
    setIsImageQuizDialogOpen,
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion,
    exportToExcel
  };
};
