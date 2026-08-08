import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, ClipboardList, Shield, Layers, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AdminEmpireTasksMonitor: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGlobalTasksData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all empire tasks
      const { data: tasksData } = await supabase
        .from('empire_tasks' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksData) {
        setTasks(tasksData);
      }

      // 2. Fetch user task progress logs
      const { data: progressData } = await supabase
        .from('user_task_progress' as any)
        .select('*, profiles(username, display_name)')
        .order('last_updated', { ascending: false });

      if (progressData) {
        setUserProgress(progressData);
      }
    } catch (err) {
      console.error('Error fetching admin global tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalTasksData();
  }, []);

  const filteredTasks = tasks.filter(t => 
    (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              Global Team Tasks & Cascade Monitor
            </CardTitle>
            <CardDescription>
              Monitor all assigned tasks, task redistributions, and troop completion records across all teams.
            </CardDescription>
          </div>
          <Button onClick={fetchGlobalTasksData} variant="outline" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search tasks by title or type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8.5 text-xs"
            />
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Rewards</TableHead>
                  <TableHead>Hierarchy Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                      No tasks found in global monitor.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        {t.title}
                        {t.description && <span className="block text-[10px] font-normal text-slate-500">{t.description}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-[9px]">{t.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase text-[9px]">{t.frequency || 'daily'}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-amber-600">{t.target_count}</TableCell>
                      <TableCell className="text-[10px] text-slate-600 font-bold">
                        +{t.reward_gems} Gems | +{t.reward_stars}★
                      </TableCell>
                      <TableCell>
                        {t.parent_task_id ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                            <Layers className="w-3 h-3" /> Sub-Task Cascaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Shield className="w-3 h-3" /> Master Task
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`uppercase text-[9px] ${
                          t.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}>
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmpireTasksMonitor;
