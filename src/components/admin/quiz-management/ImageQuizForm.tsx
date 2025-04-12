
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage 
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { createImageBasedQuestion } from '@/utils/quizDataService';
import { useToast } from '@/hooks/use-toast';
import {
  ImageUrlField,
  QuizOptionsField,
  CategoryField,
  CorrectAnswerField
} from './image-quiz';

interface ImageQuizFormProps {
  categories: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const ImageQuizForm: React.FC<ImageQuizFormProps> = ({
  categories,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [localCategories, setLocalCategories] = useState<string[]>(categories);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = {
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    difficulty: 'medium' as const,
    category: '',
    imageUrl: '',
    explanation: ''
  };

  const form = useForm({ defaultValues });

  // Update local categories when prop changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Update preview image when URL changes
  useEffect(() => {
    const imageUrl = form.watch('imageUrl');
    if (imageUrl) {
      setPreviewImage(imageUrl);
    }
  }, [form.watch('imageUrl')]);

  const handleFormSubmit = form.handleSubmit(async (data) => {
    // Ensure options array doesn't contain empty strings
    const cleanedOptions = data.options.filter(option => option.trim() !== '');
    
    if (cleanedOptions.length < 2) {
      form.setError('options', { 
        type: 'manual', 
        message: 'At least 2 non-empty options are required.' 
      });
      return;
    }
    
    if (!data.correctAnswer) {
      form.setError('correctAnswer', { 
        type: 'manual', 
        message: 'Please select the correct answer.' 
      });
      return;
    }
    
    if (!data.imageUrl) {
      form.setError('imageUrl', { 
        type: 'manual', 
        message: 'Please provide an image URL.' 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createImageBasedQuestion(
        data.question,
        cleanedOptions,
        data.correctAnswer,
        data.category,
        data.difficulty,
        data.imageUrl,
        data.explanation
      );
      
      if (success) {
        toast({
          title: "Success!",
          description: "Image quiz question created successfully",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: "Failed to create image question",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating image question:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Image URL Field */}
        <ImageUrlField 
          form={form} 
          previewImage={previewImage} 
          setPreviewImage={setPreviewImage} 
        />

        {/* Question Field */}
        <FormField
          control={form.control}
          name="question"
          rules={{ required: "Question is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What is shown in this image?" 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options Field */}
        <QuizOptionsField form={form} />

        {/* Correct Answer Field */}
        <CorrectAnswerField form={form} />

        {/* Category Field */}
        <CategoryField 
          form={form} 
          categories={localCategories}
          setLocalCategories={setLocalCategories}
        />

        {/* Difficulty Field */}
        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Difficulty</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Explanation Field */}
        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide an explanation for the correct answer" 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                An explanation to show after the user answers the question.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Image Question'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ImageQuizForm;
