import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from 'date-fns'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Eye, EyeOff, Edit, Trash, PlusCircle } from "lucide-react"
import { addDays } from 'date-fns';
import { challengesService } from '@/services/challengesService';
import { DailyChallenge } from '@/types/challenges';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from "@/components/ui/data-table"

// Import supabase client
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  num_questions: z.number().min(1, {
    message: "Number of questions must be at least 1.",
  }),
  points_multiplier: z.number().min(1, {
    message: "Points multiplier must be at least 1.",
  }),
  question_ids: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  start_date: z.date(),
  end_date: z.date(),
});

const DailyChallengesAdmin: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      num_questions: 1,
      points_multiplier: 1,
      question_ids: [],
      is_active: true,
      start_date: new Date(),
      end_date: addDays(new Date(), 7),
    },
  });

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const challengesData = await challengesService.getAllChallenges();
      setChallenges(challengesData);
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

  useEffect(() => {
    fetchChallenges();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const challengeData = {
        title: values.title,
        description: values.description || null,
        num_questions: values.num_questions,
        points_multiplier: values.points_multiplier,
        question_ids: values.question_ids || [],
        is_active: values.is_active,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        created_by: 'admin',
      };

      const { success, error } = await challengesService.createChallenge(challengeData);

      if (!success) throw error;

      toast({
        title: 'Success',
        description: 'Challenge created successfully!',
      });

      fetchChallenges();
      setOpen(false);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to create challenge',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (challenge: DailyChallenge) => {
    try {
      const { success, error } = await challengesService.toggleChallengeStatus(challenge.id, challenge.is_active);

      if (!success) throw error;

      toast({
        title: 'Success',
        description: `Challenge ${challenge.is_active ? 'deactivated' : 'activated'} successfully!`,
      });

      fetchChallenges();
    } catch (error) {
      console.error('Error toggling challenge status:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle challenge status',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      try {
        const { success, error } = await challengesService.deleteChallenge(id);

        if (!success) throw error;

        toast({
          title: 'Success',
          description: 'Challenge deleted successfully!',
        });

        fetchChallenges();
      } catch (error) {
        console.error('Error deleting challenge:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete challenge',
          variant: 'destructive'
        });
      }
    }
  };

  const handleEdit = (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge);
    form.setValue('title', challenge.title);
    form.setValue('description', challenge.description || '');
    form.setValue('num_questions', challenge.num_questions);
    form.setValue('points_multiplier', challenge.points_multiplier);
    form.setValue('is_active', challenge.is_active);
    form.setValue('start_date', new Date(challenge.start_date));
    form.setValue('end_date', new Date(challenge.end_date));
    setEditOpen(true);
  };

  const handleEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedChallenge) return;

    try {
      const { error } = await supabase
        .from('daily_challenges')
        .update({
          title: values.title,
          description: values.description,
          num_questions: values.num_questions,
          points_multiplier: values.points_multiplier,
          is_active: values.is_active,
          start_date: values.start_date.toISOString(),
          end_date: values.end_date.toISOString(),
        })
        .eq('id', selectedChallenge.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Challenge updated successfully!',
      });

      fetchChallenges();
      setEditOpen(false);
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to update challenge',
        variant: 'destructive'
      });
    }
  };

  const columns = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: (row: any) => {
        return new Date(row.getValue()).toLocaleDateString();
      }
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: (row: any) => {
        return new Date(row.getValue()).toLocaleDateString();
      }
    },
    {
      accessorKey: "num_questions",
      header: "Questions",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: (row: any) => {
        return row.getValue() ? (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-400">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-400">
            Inactive
          </Badge>
        );
      }
    },
    {
      accessorKey: "id",
      header: "Actions",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(row.row.original)}
          >
            {row.row.original.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={() => handleDelete(row.getValue())}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Daily Challenges</CardTitle>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Challenge
            </Button>
          </div>
          <CardDescription>Manage daily challenges for users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              Loading challenges...
            </div>
          ) : (
            <DataTable columns={columns} data={challenges} />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Challenge</DialogTitle>
            <DialogDescription>
              Create a new daily challenge for users.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Challenge Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Challenge Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="num_questions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Number of Questions"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="points_multiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Multiplier</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Points Multiplier"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Set the challenge as active or inactive.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < form.getValues('start_date')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Add Challenge</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
            <DialogDescription>
              Edit the selected daily challenge.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Challenge Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Challenge Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="num_questions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Number of Questions"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="points_multiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Multiplier</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Points Multiplier"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Set the challenge as active or inactive.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < form.getValues('start_date')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Update Challenge</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyChallengesAdmin;
