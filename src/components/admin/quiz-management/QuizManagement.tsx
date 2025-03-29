import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  FileQuestion,
  RefreshCw,
  Upload,
  BookOpen,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import QuizQuestionForm from './QuizQuestionForm';
import ImportQuizQuestions from './ImportQuizQuestions';
import TriviaImporter from './TriviaImporter';
import * as XLSX from 'xlsx';
import { QuizQuestion } from '@/utils/quizData';
import { useFetchSupabaseData } from '@/hooks/useFetchSupabaseData';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { findAllDuplicateQuestions } from '@/utils/quizDuplicateChecker';
import { useLocation, useNavigate } from 'react-router-dom';
import DailyChallengesManagement from './DailyChallengesManagement';

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
  const [isTriviaBatchDialogOpen, setIsTriviaBatchDialogOpen] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [isDuplicateCheckLoading, setIsDuplicateCheckLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('questions');
  const { toast } = useToast();
  const { fetchData: refreshAllData, syncToSupabase, isSyncing } = useFetchSupabaseData(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname.includes('/quiz/challenges')) {
      setActiveTab('challenges');
    } else {
      setActiveTab('questions');
    }
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'challenges') {
      navigate('/admin/quiz/challenges');
    } else {
      navigate('/admin/quiz');
    }
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      const formattedQuestions = data.map(q => {
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
          points: 10,
          explanation: q.explanation || ''
        };
      });
      
      setQuestions(formattedQuestions);
      setFilteredQuestions(formattedQuestions);
      
      const uniqueCategories = Array.from(
        new Set(formattedQuestions.map(q => q.category))
      );
      setCategories(uniqueCategories);
      
      toast({
        title: "Success",
        description: `Loaded ${formattedQuestions.length} quiz questions.`,
      });
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

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions();
    }
  }, [activeTab]);

  useEffect(() => {
    let filtered = [...questions];
    
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    
    if (selectedDifficulty && selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
    
    setFilteredQuestions(filtered);
  }, [searchQuery, selectedCategory, selectedDifficulty, questions]);

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

  const handleRefreshData = async () => {
    try {
      await refreshAllData();
      await fetchQuestions();
      
      toast({
        title: "Data Refreshed",
        description: "Quiz questions have been refreshed from the database.",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh quiz data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSyncToSupabase = async () => {
    try {
      await syncToSupabase();
      
      toast({
        title: "Data Synced",
        description: "Local data has been synced to the Supabase database.",
      });
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync local data to Supabase. Please try again.",
        variant: "destructive"
      });
    }
  };

  const checkForDuplicates = async () => {
    setIsDuplicateCheckLoading(true);
    try {
      const duplicateGroups = await findAllDuplicateQuestions();
      setDuplicateCount(duplicateGroups.length);
      
      toast({
        title: "Duplicate Check Complete",
        description: `Found ${duplicateGroups.length} groups of duplicate questions.`,
      });
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to check for duplicate questions.",
        variant: "destructive"
      });
    } finally {
      setIsDuplicateCheckLoading(false);
    }
  };

  const columns = [
    {
      header: "Question",
      accessorKey: "question",
      cell: (row: QuizQuestion) => <span className="font-medium">{row.question}</span>
    },
    {
      header: "Category",
      accessorKey: "category"
    },
    {
      header: "Difficulty",
      accessorKey: "difficulty",
      cell: (row: QuizQuestion) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
          row.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {row.difficulty}
        </span>
      )
    },
    {
      header: "Answer",
      accessorKey: "correctAnswer"
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row: QuizQuestion) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentQuestion(row);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteQuestion(row.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quiz Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="questions" className="flex items-center">
            <FileQuestion className="mr-2 h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center">
            <Award className="mr-2 h-4 w-4" />
            Challenges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                onClick={handleRefreshData}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button 
                onClick={handleSyncToSupabase}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={isSyncing}
              >
                <Upload className="h-4 w-4" />
                {isSyncing ? 'Syncing...' : 'Sync to DB'}
              </Button>
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
                onClick={() => setIsTriviaBatchDialogOpen(true)}
                variant="outline"
                className="flex items-center gap-1"
              >
                <BookOpen className="h-4 w-4" />
                Learn Trivia
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={checkForDuplicates}
                disabled={isDuplicateCheckLoading}
                className="flex items-center gap-1"
              >
                {isDuplicateCheckLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Check Duplicates
                    {duplicateCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                        {duplicateCount}
                      </span>
                    )}
                  </>
                )}
              </Button>
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
              <PaginatedDataTable
                columns={columns}
                data={filteredQuestions}
                isLoading={isLoading}
                pageSize={10}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="mt-6">
          <DailyChallengesManagement />
        </TabsContent>
      </Tabs>

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

      <Dialog open={isTriviaBatchDialogOpen} onOpenChange={setIsTriviaBatchDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Learn New Trivia Questions</DialogTitle>
            <DialogDescription>
              Import trivia questions from Open Trivia Database and check for duplicates.
            </DialogDescription>
          </DialogHeader>
          <TriviaImporter 
            onSuccess={() => {
              fetchQuestions();
              setIsTriviaBatchDialogOpen(false);
              toast({
                title: "Trivia Import Complete",
                description: "New trivia questions have been added to your quiz database.",
              });
            }}
            onCancel={() => setIsTriviaBatchDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizManagement;
