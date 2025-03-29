
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { fetchTriviaQuestions, saveTriviaToDB, getTriviaCategories } from '@/utils/triviaFetcher';
import { findAllDuplicateQuestions } from '@/utils/quizDuplicateChecker';
import { AlertCircle, Download, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';

interface TriviaImporterProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TriviaImporter: React.FC<TriviaImporterProps> = ({ onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(10);
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [duplicates, setDuplicates] = useState<any[][]>([]);
  const [tab, setTab] = useState<string>('import');
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<number | null>(null);
  const [isDuplicateLoading, setIsDuplicateLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getTriviaCategories();
      setCategories(cats);
    };
    
    loadCategories();
  }, []);

  const handleImport = async () => {
    setIsLoading(true);
    setProgress(10);
    setQuestions([]);
    
    try {
      const categoryId = category ? parseInt(category) : undefined;
      const difficultyValue = difficulty || undefined;
      
      // Fetch questions from Open Trivia DB
      setProgress(30);
      const fetchedQuestions = await fetchTriviaQuestions(
        amount, 
        categoryId as number | undefined, 
        difficultyValue as 'easy' | 'medium' | 'hard' | undefined
      );
      
      setProgress(60);
      
      if (fetchedQuestions.length === 0) {
        toast({
          title: "No Questions Found",
          description: "No trivia questions were found with the selected criteria.",
          variant: "destructive"
        });
        setIsLoading(false);
        setProgress(0);
        return;
      }
      
      setQuestions(fetchedQuestions);
      setProgress(80);
      
      // Save questions to the database
      const result = await saveTriviaToDB(fetchedQuestions);
      
      setProgress(100);
      
      toast({
        title: "Import Complete",
        description: `Saved ${result.saved} questions. Skipped ${result.duplicates} duplicates. ${result.errors} errors.`,
        variant: result.errors > 0 ? "destructive" : "default"
      });
      
      if (onSuccess && result.saved > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error importing trivia:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import trivia questions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckDuplicates = async () => {
    setIsDuplicateLoading(true);
    
    try {
      const duplicateGroups = await findAllDuplicateQuestions();
      setDuplicates(duplicateGroups);
      
      toast({
        title: "Duplicate Check Complete",
        description: `Found ${duplicateGroups.length} groups of duplicate questions.`
      });
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast({
        title: "Check Failed",
        description: "Failed to check for duplicate questions.",
        variant: "destructive"
      });
    } finally {
      setIsDuplicateLoading(false);
    }
  };

  const handleDeleteDuplicate = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);
        
      if (error) {
        throw error;
      }
      
      // Update the duplicates list
      if (selectedDuplicateGroup !== null) {
        const updatedGroup = duplicates[selectedDuplicateGroup]
          .filter(q => q.id !== questionId);
        
        const newDuplicates = [...duplicates];
        
        if (updatedGroup.length <= 1) {
          // If only one question remains, it's no longer a duplicate group
          newDuplicates.splice(selectedDuplicateGroup, 1);
          setSelectedDuplicateGroup(null);
        } else {
          newDuplicates[selectedDuplicateGroup] = updatedGroup;
        }
        
        setDuplicates(newDuplicates);
      }
      
      toast({
        title: "Question Deleted",
        description: "The duplicate question was successfully deleted."
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the question.",
        variant: "destructive"
      });
    }
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="import">Import Questions</TabsTrigger>
        <TabsTrigger value="duplicates">Check Duplicates</TabsTrigger>
      </TabsList>
      
      <TabsContent value="import" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Number of Questions</label>
            <Input
              type="number"
              min={1}
              max={50}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Any Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Category</SelectItem>
                {Object.entries(categories).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Any Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Difficulty</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              {progress < 30 ? "Preparing to fetch questions..." :
               progress < 60 ? "Fetching questions from Open Trivia DB..." :
               progress < 80 ? "Processing questions..." :
               "Saving questions to database..."}
            </p>
          </div>
        )}
        
        {!isLoading && questions.length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium mb-2">Imported Questions</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {questions.map((q, index) => (
                <div key={index} className="text-sm border-b pb-2">
                  <p className="font-medium">{q.question}</p>
                  <p className="text-green-600">✓ {q.correctAnswer}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded-full">{q.category}</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleImport}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Import Questions
              </>
            )}
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="duplicates" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Check for Duplicate Questions</h3>
          <Button
            onClick={handleCheckDuplicates}
            disabled={isDuplicateLoading}
            size="sm"
            className="flex items-center gap-1"
          >
            {isDuplicateLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Run Check
              </>
            )}
          </Button>
        </div>
        
        {isDuplicateLoading && (
          <div className="py-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Analyzing questions for duplicates...
            </p>
          </div>
        )}
        
        {!isDuplicateLoading && duplicates.length === 0 && (
          <div className="py-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Run the duplicate check to find similar questions.
            </p>
          </div>
        )}
        
        {!isDuplicateLoading && duplicates.length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium mb-4">
              Found {duplicates.length} groups of duplicate questions
            </h3>
            
            <Accordion 
              type="single" 
              collapsible 
              className="w-full"
              value={selectedDuplicateGroup !== null ? String(selectedDuplicateGroup) : undefined}
              onValueChange={(value) => setSelectedDuplicateGroup(value ? parseInt(value) : null)}
            >
              {duplicates.map((group, groupIndex) => (
                <AccordionItem key={groupIndex} value={String(groupIndex)}>
                  <AccordionTrigger>
                    <span className="text-sm">
                      Group #{groupIndex + 1} - {group.length} similar questions
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {group.map((question, qIndex) => (
                        <div key={qIndex} className="flex justify-between items-start border-b pb-2">
                          <div className="flex-1">
                            <p className="text-sm">{question.question}</p>
                            <p className="text-xs text-muted-foreground">ID: {question.id}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => handleDeleteDuplicate(question.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default TriviaImporter;
