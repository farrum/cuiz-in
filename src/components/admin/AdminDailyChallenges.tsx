
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Play, Pause } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';

interface DailyChallenge {
  id: string;
  title: string;
  description: string | null;
  num_questions: number;
  points_multiplier: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  question_ids: string[];
  created_at: string;
}

export default function AdminDailyChallenges() {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    num_questions: 5,
    points_multiplier: 2,
    start_date: '',
    end_date: '',
    is_active: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
    fetchQuizQuestions();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
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
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question, category, difficulty')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleQuestionSelect = (questionId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedQuestions([...selectedQuestions, questionId]);
    } else {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
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
        description: `Challenge ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
      
      fetchChallenges();
    } catch (error) {
      console.error('Error toggling challenge status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update challenge status',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedQuestions.length < formData.num_questions) {
      toast({
        title: 'Error',
        description: `Please select at least ${formData.num_questions} questions`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const selectedQuestionsForUse = selectedQuestions.slice(0, formData.num_questions);
      
      const challengeData = {
        title: formData.title,
        description: formData.description,
        num_questions: formData.num_questions,
        points_multiplier: formData.points_multiplier,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        is_active: formData.is_active,
        question_ids: selectedQuestionsForUse,
      };

      let result;
      
      if (editingId) {
        result = await supabase
          .from('daily_challenges')
          .update(challengeData)
          .eq('id', editingId);
      } else {
        result = await supabase
          .from('daily_challenges')
          .insert([challengeData]);
      }

      if (result.error) throw result.error;
      
      toast({
        title: 'Success',
        description: `Challenge ${editingId ? 'updated' : 'created'} successfully`,
      });
      
      resetForm();
      fetchChallenges();
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to save challenge',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (challenge: DailyChallenge) => {
    setFormData({
      title: challenge.title,
      description: challenge.description || '',
      num_questions: challenge.num_questions,
      points_multiplier: challenge.points_multiplier,
      start_date: challenge.start_date.split('T')[0],
      end_date: challenge.end_date.split('T')[0],
      is_active: challenge.is_active,
    });
    setSelectedQuestions(challenge.question_ids);
    setEditingId(challenge.id);
    setActiveTab('create');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    
    try {
      const { error } = await supabase
        .from('daily_challenges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Challenge deleted successfully',
      });
      
      fetchChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete challenge',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      num_questions: 5,
      points_multiplier: 2,
      start_date: '',
      end_date: '',
      is_active: false,
    });
    setSelectedQuestions([]);
    setEditingId(null);
  };

  const columns = [
    {
      header: 'Title',
      accessorKey: 'title',
    },
    {
      header: 'Questions',
      accessorKey: 'num_questions',
    },
    {
      header: 'Gems Multiplier',
      accessorKey: 'points_multiplier',
      cell: (row: any) => `${row.points_multiplier}x`,
    },
    {
      header: 'Start Date',
      accessorKey: 'start_date',
      cell: (row: any) => format(new Date(row.start_date), 'yyyy-MM-dd'),
    },
    {
      header: 'End Date',
      accessorKey: 'end_date',
      cell: (row: any) => format(new Date(row.end_date), 'yyyy-MM-dd'),
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: (row: any) => (
        <div className="flex items-center">
          <Switch 
            checked={row.is_active} 
            onCheckedChange={() => handleToggleActive(row.id, row.is_active)}
            className="mr-2"
          />
          <span>{row.is_active ? 'Active' : 'Inactive'}</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row: any) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDelete(row.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Challenges</CardTitle>
          <CardDescription>
            Create and manage daily challenges with special rewards for players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="list">All Challenges</TabsTrigger>
              <TabsTrigger value="create">{editingId ? 'Edit Challenge' : 'Create Challenge'}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <DataTable 
                columns={columns} 
                data={challenges} 
                isLoading={loading} 
              />
              <Button 
                onClick={() => { resetForm(); setActiveTab('create'); }} 
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Challenge
              </Button>
            </TabsContent>
            
            <TabsContent value="create">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Challenge Title</Label>
                    <Input 
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="num_questions">Number of Questions</Label>
                    <Input 
                      id="num_questions"
                      name="num_questions"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.num_questions}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="points_multiplier">Gems Multiplier</Label>
                    <Input 
                      id="points_multiplier"
                      name="points_multiplier"
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      value={formData.points_multiplier}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="is_active">Status</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch 
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                      <span>{formData.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input 
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input 
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Select Questions ({selectedQuestions.length} selected)</Label>
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                    {quizQuestions.length === 0 ? (
                      <p className="text-muted-foreground">No questions available</p>
                    ) : (
                      <div className="space-y-2">
                        {quizQuestions.map((question) => (
                          <div key={question.id} className="flex items-start">
                            <input
                              type="checkbox"
                              id={`question-${question.id}`}
                              className="mt-1 mr-2"
                              checked={selectedQuestions.includes(question.id)}
                              onChange={(e) => handleQuestionSelect(question.id, e.target.checked)}
                            />
                            <label htmlFor={`question-${question.id}`} className="text-sm">
                              <span className="font-medium block">{question.question}</span>
                              <span className="text-xs text-muted-foreground">
                                {question.category} • {question.difficulty}
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedQuestions.length} / Required: {formData.num_questions}
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      resetForm();
                      setActiveTab('list');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Update Challenge' : 'Create Challenge'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
