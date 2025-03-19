
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QuizQuestionImport {
  question: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export const useBatchQuizImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const importQuestions = async (questions: QuizQuestionImport[]) => {
    setIsImporting(true);
    setProgress(0);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process questions in batches to avoid overwhelming the database
      const batchSize = 5;
      const totalBatches = Math.ceil(questions.length / batchSize);

      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        
        // Prepare the batch for insertion
        const formattedBatch = batch.map(q => ({
          question: q.question,
          options: q.options,
          correct_answer: q.correctAnswer,
          category: q.category,
          difficulty: q.difficulty,
          explanation: q.explanation
        }));

        // Insert the batch
        const { data, error } = await supabase
          .from('quiz_questions')
          .insert(formattedBatch)
          .select();

        if (error) {
          console.error('Error importing batch:', error);
          errorCount += batch.length;
        } else {
          successCount += data?.length || 0;
        }

        // Update progress
        const currentBatch = Math.floor(i / batchSize) + 1;
        setProgress((currentBatch / totalBatches) * 100);
      }

      if (successCount > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${successCount} questions${errorCount > 0 ? `, failed to import ${errorCount} questions.` : '.'}`
        });
        return true;
      } else {
        toast({
          title: "Import Failed",
          description: "Failed to import any questions. Please check the console for errors.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error in batch import:', error);
      toast({
        title: "Import Error",
        description: "An unexpected error occurred during the import process.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  return {
    importQuestions,
    isImporting,
    progress
  };
};
