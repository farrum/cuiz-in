
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Calendar as CalendarIcon, Plus, RefreshCw, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

// Types for the challenges
interface DailyChallenge {
  id: string;
  title: string;
  description: string | null;
  num_questions: number;
  points_multiplier: number;
  question_ids: string[];
  is_active: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
  created_by: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  category: string;
}

const DailyChallengesAdmin: React.FC = () => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsMultiplier, setPointsMultiplier] = useState(2);
  const [isActive, setIsActive] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date | undefined }>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 7))
  });
  
  // Set up realtime updates
  const { lastUpdate } = useSupabaseRealtime('daily_challenges');
  
  // Fetch challenges and quiz questions
  useEffect(() => {
    fetchChallenges();
    fetchQuizQuestions();
  }, [lastUpdate]);
  
  const fetchChallenges = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast({
        title: 'Error',
        description: 'Failed to load challenges',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchQuizQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question, category')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setQuizQuestions(data || []);
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quiz questions',
        variant: 'destructive'
      });
    }
  };
  
  const handleCreateChallenge = async () => {
    if (!title) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title for the challenge',
        variant: 'destructive'
      });
      return;
    }
    
    if (selectedQuestions.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please select at least one question for the challenge',
        variant: 'destructive'
      });
      return;
    }
    
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: 'Missing information',
        description: 'Please specify the start and end dates for the challenge',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');
      
      const newChallenge = {
        title,
        description: description || null,
        num_questions: selectedQuestions.length,
        points_multiplier: pointsMultiplier,
        question_ids: selectedQuestions,
        is_active: isActive,
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
        created_by: userData.user.id
      };
      
      const { error } = await supabase
        .from('daily_challenges')
        .insert([newChallenge]);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Challenge created successfully'
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setPointsMultiplier(2);
      setIsActive(false);
      setSelectedQuestions([]);
      setDateRange({ from: new Date(), to: new Date(new Date().setDate(new Date().getDate() + 7)) });
      
      // Refresh challenges list
      fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to create challenge',
        variant: 'destructive'
      });
    }
  };
  
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('daily_challenges')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Challenge ${currentStatus ? 'deactivated' : 'activated'} successfully`
      });
      
      // Refresh challenges list
      fetchChallenges();
    } catch (error) {
      console.error('Error toggling challenge status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update challenge status',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteChallenge = async (id: string) => {
    try {
      // First, delete related progress entries
      const { error: progressError } = await supabase
        .from('user_challenge_progress')
        .delete()
        .eq('challenge_id', id);
        
      if (progressError) throw progressError;
      
      // Then delete the challenge
      const { error } = await supabase
        .from('daily_challenges')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Challenge deleted successfully'
      });
      
      // Refresh challenges list
      fetchChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete challenge',
        variant: 'destructive'
      });
    }
  };
  
  const toggleQuestionSelection = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };
  
  // Table columns for challenges
  const challengeColumns = [
    {
      header: "Title",
      accessorKey: "title"
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (row: any) => (
        <Badge variant={row.is_active ? "success" : "secondary"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      header: "Questions",
      accessorKey: "num_questions",
      cell: (row: any) => `${row.num_questions} questions`
    },
    {
      header: "Points Multiplier",
      accessorKey: "points_multiplier",
      cell: (row: any) => `${row.points_multiplier}x`
    },
    {
      header: "Period",
      accessorKey: "start_date",
      cell: (row: any) => (
        <div className="text-sm">
          <div>{format(new Date(row.start_date), 'MMM d, yyyy')}</div>
          <div className="text-muted-foreground">to</div>
          <div>{format(new Date(row.end_date), 'MMM d, yyyy')}</div>
        </div>
      )
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row: any) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleToggleActive(row.id, row.is_active)}
          >
            {row.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleDeleteChallenge(row.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Challenges</CardTitle>
        <CardDescription>
          Create and manage timed challenges for your users
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Manage Challenges</TabsTrigger>
            <TabsTrigger value="create">Create New Challenge</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchChallenges}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
            
            <DataTable 
              columns={challengeColumns} 
              data={challenges} 
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Weekend Trivia Challenge" 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Complete this weekend challenge to earn bonus points!" 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="date-range">Challenge Period *</Label>
                <DatePickerWithRange 
                  date={dateRange} 
                  setDate={setDateRange} 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="points">Points Multiplier</Label>
                <Input 
                  id="points" 
                  type="number" 
                  min="1"
                  max="10"
                  value={pointsMultiplier} 
                  onChange={(e) => setPointsMultiplier(Number(e.target.value))} 
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="active" 
                  checked={isActive} 
                  onCheckedChange={setIsActive} 
                />
                <Label htmlFor="active">Activate immediately</Label>
              </div>
              
              <div className="grid gap-2 mt-4">
                <Label>Select Questions for the Challenge *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Selected: {selectedQuestions.length} questions
                </p>
                
                <div className="border rounded-md h-64 overflow-y-auto p-2">
                  {quizQuestions.map((question) => (
                    <div 
                      key={question.id} 
                      className={`p-2 mb-1 rounded-md cursor-pointer flex items-center ${
                        selectedQuestions.includes(question.id) 
                          ? 'bg-primary/10 border-primary/20 border' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => toggleQuestionSelection(question.id)}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedQuestions.includes(question.id)} 
                        onChange={() => {}} 
                        className="mr-2" 
                      />
                      <div>
                        <p className="font-medium">{question.question}</p>
                        <Badge variant="outline" className="mt-1">
                          {question.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {activeTab === 'create' && (
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleCreateChallenge} className="ml-auto">
            <Plus className="h-4 w-4 mr-1" />
            Create Challenge
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default DailyChallengesAdmin;
