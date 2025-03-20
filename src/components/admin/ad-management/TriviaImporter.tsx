
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useBatchQuizImport } from './hooks/useBatchQuizImport';
import { FileUp, Check, X } from 'lucide-react';

const sampleQuestions = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctAnswer: "Paris",
    category: "Geography",
    difficulty: "easy" as const,
    explanation: "Paris is the capital and most populous city of France."
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars",
    category: "Astronomy",
    difficulty: "easy" as const,
    explanation: "Mars appears reddish because of iron oxide (rust) on its surface."
  },
  // Add more sample questions here
];

const TriviaImporter: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const { importQuestions, progress } = useBatchQuizImport();

  const handleImportSampleQuestions = async () => {
    setIsImporting(true);
    setIsComplete(false);

    try {
      const result = await importQuestions(sampleQuestions);
      setSuccess(result);
      
      if (result) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${sampleQuestions.length} sample questions.`
        });
      } else {
        toast({
          title: "Import Failed",
          description: "Failed to import sample questions.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error importing sample questions:", error);
      setSuccess(false);
      toast({
        title: "Import Error",
        description: "An unexpected error occurred during import.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setIsComplete(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trivia Importer</CardTitle>
        <CardDescription>
          Import sample trivia questions or add your own quiz content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isImporting ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Importing questions...</p>
            <Progress value={progress} className="w-full" />
          </div>
        ) : isComplete ? (
          <div className="flex items-center gap-2">
            {success ? (
              <>
                <Check className="h-5 w-5 text-green-500" />
                <p className="text-green-600">Successfully imported sample questions</p>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-red-500" />
                <p className="text-red-600">Failed to import questions</p>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click the button below to import a set of sample trivia questions to get started.
            This will add {sampleQuestions.length} questions across various categories.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleImportSampleQuestions} 
          disabled={isImporting}
          className="w-full"
        >
          <FileUp className="mr-2 h-4 w-4" />
          {isImporting ? "Importing..." : "Import Sample Questions"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TriviaImporter;
