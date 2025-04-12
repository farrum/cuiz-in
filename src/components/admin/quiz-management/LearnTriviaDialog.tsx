
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Loader2 } from 'lucide-react';
import { fetchTriviaQuestions, saveTriviaToDB, getTriviaCategories } from '@/utils/triviaFetcher';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LearnTriviaDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const LearnTriviaDialog: React.FC<LearnTriviaDialogProps> = ({ onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getTriviaCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load trivia categories');
      }
    };
    
    loadCategories();
  }, []);

  const handleLearnTrivia = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert amount to number and set defaults
      const questionAmount = amount || 10;
      const categoryId = selectedCategory ? parseInt(selectedCategory) : undefined;
      const selectedDifficulty = difficulty || undefined;
      
      // Fetch questions
      toast({
        title: "Fetching Questions",
        description: `Fetching ${questionAmount} questions from Open Trivia DB...`,
      });
      
      const questions = await fetchTriviaQuestions(
        questionAmount, 
        categoryId, 
        selectedDifficulty as 'easy' | 'medium' | 'hard' | undefined
      );
      
      if (!questions || questions.length === 0) {
        setError('No questions found with the selected criteria');
        setIsLoading(false);
        return;
      }
      
      // Save to database
      toast({
        title: "Processing",
        description: `Saving ${questions.length} questions to database...`,
      });
      
      const result = await saveTriviaToDB(questions);
      
      toast({
        title: "Success",
        description: `Added ${result.saved} new questions! (${result.duplicates} duplicates skipped, ${result.errors} errors)`,
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error learning trivia questions:', err);
      setError('Failed to fetch or save trivia questions');
      toast({
        title: "Error",
        description: "Failed to learn trivia questions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center py-2">
        <BookOpen className="h-12 w-12 text-primary mb-4" />
        <h3 className="text-lg font-medium">Learn New Trivia Questions</h3>
        <p className="text-muted-foreground mt-1 mb-4">
          Import questions from the Open Trivia Database to enhance your quiz collection.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Number of Questions</label>
          <Input 
            type="number" 
            min={1}
            max={50}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
          />
          <p className="text-xs text-muted-foreground mt-1">Maximum 50 questions per request</p>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Category (Optional)</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Any Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Category</SelectItem>
              {Object.entries(categories).map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Difficulty (Optional)</label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Any Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={handleLearnTrivia}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Learning...
            </>
          ) : 'Learn Questions'}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default LearnTriviaDialog;
