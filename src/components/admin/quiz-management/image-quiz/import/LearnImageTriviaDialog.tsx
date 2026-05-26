
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { fetchTriviaQuestions, getTriviaCategories } from '@/utils/triviaFetcher';
import { AmountField, CategoryField, DifficultyField } from './ImportFormFields';
import ImportInfoAlert from './ImportInfoAlert';
import { getRandomImageForCategory } from './imageSelectionUtils';
import { saveImageTriviaToDB } from './imageTriviaSaveService';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';

interface LearnImageTriviaDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const LearnImageTriviaDialog: React.FC<LearnImageTriviaDialogProps> = ({ onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Record<number, string>>({});
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      amount: '10',
      category: '',
      difficulty: ''
    }
  });

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getTriviaCategories();
      setCategories(cats);
    };
    
    loadCategories();
  }, []);

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    
    try {
      const amount = parseInt(data.amount, 10);
      const category = data.category ? parseInt(data.category, 10) : undefined;
      const difficulty = data.difficulty || undefined;
      
      toast({
        title: "Fetching trivia questions",
        description: "Please wait while we fetch and process the questions...",
      });
      
      const questions = await fetchTriviaQuestions(amount, category, difficulty as any);
      
      if (questions.length === 0) {
        toast({
          title: "No questions found",
          description: "Try different criteria or try again later.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Finding relevant images",
        description: `Resolving images for ${questions.length} questions. This may take a minute...`,
      });

      const adminUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const imageQuestions: any[] = [];
      let resolved = 0;
      // Sequential to respect AI rate limits
      for (const q of questions) {
        let imageUrl = getRandomImageForCategory(q.category, q.question);
        try {
          const { data, error } = await supabase.functions.invoke('resolve-question-image', {
            body: {
              adminUserId,
              question: q.question,
              correctAnswer: q.correctAnswer,
              category: q.category,
            },
          });
          if (!error && data?.imageUrl) imageUrl = data.imageUrl;
        } catch (e) {
          console.warn('resolve-question-image failed, using fallback', e);
        }
        imageQuestions.push({ ...q, imageUrl, questionType: 'image' as const });
        resolved++;
        if (resolved % 3 === 0) {
          toast({
            title: 'Finding relevant images',
            description: `${resolved}/${questions.length} resolved...`,
          });
        }
      }
      
      const result = await saveImageTriviaToDB(imageQuestions as any);
      
      toast({
        title: "Import complete",
        description: `Successfully added ${result.saved} new image questions. (${result.duplicates} duplicates skipped)`,
        variant: result.saved > 0 ? "default" : "destructive"
      });
      
      if (result.saved > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error importing trivia:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing trivia questions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="space-y-4">
      <ImportInfoAlert />
      
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AmountField form={form} />
          <CategoryField form={form} categories={categories} />
          <DifficultyField form={form} />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  Import Image Trivia
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LearnImageTriviaDialog;
