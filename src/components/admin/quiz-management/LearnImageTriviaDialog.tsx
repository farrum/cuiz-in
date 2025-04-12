
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileImage, Loader2 } from 'lucide-react';
import { fetchImageQuizQuestions, saveImageTriviaToDB } from '@/utils/triviaFetcher';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LearnImageTriviaDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const LearnImageTriviaDialog: React.FC<LearnImageTriviaDialogProps> = ({ onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<number>(5);
  const [category, setCategory] = useState<string>("any");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLearnTrivia = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert amount to number and set defaults
      const questionAmount = amount || 5;
      
      // Fetch image questions
      toast({
        title: "Fetching Image Questions",
        description: `Fetching ${questionAmount} image-based questions...`,
      });
      
      const questions = await fetchImageQuizQuestions(
        questionAmount, 
        category !== "any" ? category : undefined
      );
      
      if (!questions || questions.length === 0) {
        setError('No image questions found with the selected criteria');
        setIsLoading(false);
        return;
      }
      
      // Save to database
      toast({
        title: "Processing",
        description: `Saving ${questions.length} image questions to database...`,
      });
      
      const result = await saveImageTriviaToDB(questions);
      
      toast({
        title: "Success",
        description: `Added ${result.saved} new image questions! (${result.duplicates} duplicates skipped, ${result.errors} errors)`,
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error learning image trivia questions:', err);
      setError('Failed to fetch or save image trivia questions');
      toast({
        title: "Error",
        description: "Failed to learn image trivia questions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center py-2">
        <FileImage className="h-12 w-12 text-primary mb-4" />
        <h3 className="text-lg font-medium">Learn New Image Quiz Questions</h3>
        <p className="text-muted-foreground mt-1 mb-4">
          Import image-based questions to enhance your quiz collection.
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
            max={10}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
          />
          <p className="text-xs text-muted-foreground mt-1">Maximum 10 image questions per request</p>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Category (Optional)</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Any Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Category</SelectItem>
              <SelectItem value="Animals">Animals</SelectItem>
              <SelectItem value="Architecture">Architecture</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Nature">Nature</SelectItem>
              <SelectItem value="Art">Art</SelectItem>
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
          ) : 'Learn Image Questions'}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default LearnImageTriviaDialog;
