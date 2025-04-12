
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Loader2, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { fetchTriviaQuestions, saveTriviaToDB, getTriviaCategories } from '@/utils/triviaFetcher';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  React.useEffect(() => {
    const loadCategories = async () => {
      const cats = await getTriviaCategories();
      setCategories(cats);
    };
    
    loadCategories();
  }, []);

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsLoading(true);
    
    try {
      // Convert amount to number
      const amount = parseInt(data.amount, 10);
      
      // Only convert category to number if it's provided
      const category = data.category ? parseInt(data.category, 10) : undefined;
      
      // Only use difficulty if it's provided
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
      
      // Convert text trivia to image trivia
      const imageQuestions = questions.map(q => ({
        ...q,
        imageUrl: getRandomImageForCategory(q.category),
        questionType: 'image' as const
      }));
      
      toast({
        title: "Processing questions",
        description: `Found ${imageQuestions.length} questions. Converting to image questions...`,
      });
      
      // Save the questions to the database
      const result = await saveImageTriviaToDB(imageQuestions);
      
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

  // Function to get a random image URL based on the question category
  const getRandomImageForCategory = (category: string): string => {
    // A collection of image URLs organized by category
    const categoryImages: Record<string, string[]> = {
      'Science': [
        'https://images.unsplash.com/photo-1517976487492-5750f3195933',
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d',
        'https://images.unsplash.com/photo-1564325724739-bae0bd08762c'
      ],
      'History': [
        'https://images.unsplash.com/photo-1461360370896-922624d12aa1',
        'https://images.unsplash.com/photo-1491555103944-7c647fd857e6',
        'https://images.unsplash.com/photo-1566378246598-5b11a0d486cc'
      ],
      'Geography': [
        'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef'
      ],
      'Entertainment': [
        'https://images.unsplash.com/photo-1603190287605-e6ade32fa852',
        'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0',
        'https://images.unsplash.com/photo-1585699324551-f6c309eedeca'
      ],
      'Sports': [
        'https://images.unsplash.com/photo-1517649763962-0c623066013b',
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55',
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e'
      ],
      'Art': [
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
        'https://images.unsplash.com/photo-1578926288207-a90a5366759d',
        'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1'
      ]
    };
    
    // Default images for categories not in our mapping
    const defaultImages = [
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04',
      'https://images.unsplash.com/photo-1546521343-4eb2c01aa44b',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1'
    ];
    
    // Find the appropriate category image list
    let imageList = defaultImages;
    for (const [key, images] of Object.entries(categoryImages)) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        imageList = images;
        break;
      }
    }
    
    // Return a random image from the list
    return imageList[Math.floor(Math.random() * imageList.length)];
  };
  
  // Function to save image trivia to the database
  const saveImageTriviaToDB = async (questions: any[]) => {
    let saved = 0;
    let duplicates = 0;
    let errors = 0;
    
    for (const question of questions) {
      try {
        // Insert the question into the database
        const { data, error } = await window.supabase
          .from('quiz_questions')
          .insert({
            question: question.question,
            options: question.options,
            correct_answer: question.correctAnswer,
            difficulty: question.difficulty,
            category: question.category,
            explanation: question.explanation,
            points: question.difficulty === 'easy' ? 2 : question.difficulty === 'medium' ? 3 : 4,
            question_type: 'image',
            image_url: question.imageUrl
          })
          .select();
          
        if (error) {
          // Check if it's a duplicate error
          if (error.message.includes('duplicate')) {
            duplicates++;
          } else {
            console.error('Error saving question:', error);
            errors++;
          }
        } else {
          saved++;
        }
      } catch (e) {
        console.error('Error processing question:', e);
        errors++;
      }
    }
    
    return { saved, duplicates, errors };
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Image Trivia Import</AlertTitle>
        <AlertDescription>
          This will fetch text-based trivia questions and convert them to image quiz questions by 
          adding appropriate images based on the question category.
        </AlertDescription>
      </Alert>
      
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Questions</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select amount" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                    <SelectItem value="30">30 questions</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The number of questions to import.
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Any category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Any category</SelectItem>
                    {Object.entries(categories).map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a category or leave blank for random categories.
                </FormDescription>
              </FormItem>
            )}
          />
          
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
                      <SelectValue placeholder="Any difficulty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Any difficulty</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a difficulty level or leave blank for mixed difficulty.
                </FormDescription>
              </FormItem>
            )}
          />
          
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
