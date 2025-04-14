
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { Users, Settings, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

const challengeSchema = z.object({
  name: z.string().min(3, { message: "Challenge name must be at least 3 characters" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  teamSize: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
    message: "Team size must be a positive number"
  }),
});

interface TeamQuizManagementProps {
  activeTab: string;
}

const TeamQuizManagement: React.FC<TeamQuizManagementProps> = ({ activeTab }) => {
  const [teamChallenges, setTeamChallenges] = useState([]);
  const [teamQuizSettings, setTeamQuizSettings] = useState({
    maxTeamSize: 4,
    pointMultiplier: 1.5,
    allowAITeamMembers: true
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      name: '',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      teamSize: '4',
    },
  });

  const teamChallengeColumns = [
    { header: 'Challenge Name', accessorKey: 'name' },
    { header: 'Start Date', accessorKey: 'startDate' },
    { header: 'End Date', accessorKey: 'endDate' },
    { header: 'Team Size', accessorKey: 'teamSize' },
  ];

  const handleCreateChallenge = (data) => {
    const newChallenge = {
      id: `challenge-${Date.now()}`, // In a real app, this would come from the database
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      teamSize: parseInt(data.teamSize),
    };
    
    setTeamChallenges([...teamChallenges, newChallenge]);
    setIsCreateDialogOpen(false);
    form.reset();
    
    toast({
      title: "Team Challenge Created",
      description: `${data.name} has been created successfully.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {activeTab === 'challenges' ? (
            <Users className="mr-2" /> 
          ) : (
            <Settings className="mr-2" />
          )}
          {activeTab === 'challenges' ? 'Team Quiz Challenges' : 'Team Quiz Settings'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Create Team Challenge
            </Button>
            
            {teamChallenges.length > 0 ? (
              <PaginatedDataTable 
                columns={teamChallengeColumns}
                data={teamChallenges}
                pageSize={10}
              />
            ) : (
              <div className="text-center py-8 border rounded-md bg-gray-50">
                <p className="text-muted-foreground">No team challenges created yet</p>
                <p className="text-sm text-muted-foreground mt-1">Click the button above to create your first team challenge</p>
              </div>
            )}
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Team Challenge</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateChallenge)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Challenge Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter challenge name..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Size</FormLabel>
                          <FormControl>
                            <Input type="number" min="2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter className="mt-6">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Challenge</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Team Configuration</h3>
              {/* Add form for team quiz settings */}
              <p>Configure global settings for team quizzes</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamQuizManagement;
