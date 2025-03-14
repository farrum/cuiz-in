
import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle, 
  FileUp, 
  Search, 
  Edit, 
  Trash, 
  Download, 
  FileQuestion 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import QuizQuestionForm from './QuizQuestionForm';
import ImportQuizQuestions from './ImportQuizQuestions';
import * as XLSX from 'xlsx';
import { QuizQuestion } from '@/utils/quizData';

// Fix: Export the component as default
const QuizManagement: React.FC = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuizQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all quiz questions from Supabase
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      // Transform the data to match our QuizQuestion interface
      const formattedQuestions = data.map(q => {
        // Create properly typed options array by converting all values to strings
        const optionsArray: string[] = Array.isArray(q.options) 
          ? q.options.map(String) 
          : typeof q.options === 'object' 
            ? Object.values(q.options).map(String) 
            : [];
        
        return {
          id: q.id,
          question: q.question,
          options: optionsArray,
          correctAnswer: q.correct_answer,
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'easy',
          category: q.category || 'General Knowledge',
          points: q.points || 10,
          explanation: q.explanation || ''
        };
      });
      
      setQuestions(formattedQuestions);
      setFilteredQuestions(formattedQuestions);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(formattedQuestions.map(q => q.category))
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz questions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Filter questions based on search, category, and difficulty
  useEffect(() => {
    let filtered = [...questions];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    
    // Apply difficulty filter
    if (selectedDifficulty && selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
    
    setFilteredQuestions(filtered);
  }, [searchQuery, selectedCategory, selectedDifficulty, questions]);

  // Handle adding a new question
  const handleAddQuestion = async (question: Omit<QuizQuestion, 'id'>) => {
    try {
      console.log("Adding question:", question);
      
      // Ensure options are properly formatted as an array of strings
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
          explanation: question.explanation || ''
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
      
      // Update the categories list if we have a new category
      if (question.category && !categories.includes(question.category)) {
        setCategories([...categories, question.category]);
      }
      
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

  // Handle updating a question
  const handleUpdateQuestion = async (question: QuizQuestion) => {
    try {
      // Ensure options are properly formatted as an array of strings
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
      
      // Update the categories list if we have a new category
      if (question.category && !categories.includes(question.category)) {
        setCategories([...categories, question.category]);
      }
      
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

  // Handle deleting a question
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

  // Export questions to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      questions.map(q => ({
        Question: q.question,
        Options: q.options.join('|'),
        CorrectAnswer: q.correctAnswer,
        Category: q.category,
        Difficulty: q.difficulty,
        Explanation: q.explanation || ''
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quiz Questions');
    XLSX.writeFile(workbook, 'quiz_questions.xlsx');
    
    toast({
      title: "Success",
      description: "Questions exported to Excel.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quiz Questions Management</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Add Question
          </Button>
          <Button 
            onClick={() => setIsImportDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-1"
          >
            <FileUp className="h-4 w-4" />
            Import
          </Button>
          <Button 
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search questions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-muted py-10 rounded-md flex flex-col items-center justify-center text-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Questions Found</h3>
          <p className="text-muted-foreground mt-1 mb-4 max-w-md">
            {searchQuery || selectedCategory || selectedDifficulty 
              ? "Try adjusting your filters to see more results."
              : "Get started by adding some quiz questions."}
          </p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Question
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.slice(0, 50).map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{question.question}</TableCell>
                  <TableCell>{question.category}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                  </TableCell>
                  <TableCell>{question.correctAnswer}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentQuestion(question);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredQuestions.length > 50 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Showing first 50 of {filteredQuestions.length} questions. Please refine your search to see more specific results.
            </div>
          )}
        </div>
      )}

      {/* Add Question Dialog */}
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

      {/* Edit Question Dialog */}
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

      {/* Import Questions Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Quiz Questions</DialogTitle>
            <DialogDescription>
              Upload an Excel file with quiz questions. 
              The file should have columns for Question, Options, CorrectAnswer, Category, Difficulty, and Explanation.
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
    </div>
  );
};

// Make sure we export as default
export default QuizManagement;
