
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, AlertTriangle, LineChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import TeamPointsOverview from '@/components/team-leader/TeamPointsOverview';
import TeamMembersList from '@/components/team-leader/TeamMembersList';

const TeamLeaderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, refreshUserRole } = useAuth();
  
  useEffect(() => {
    const checkAccess = async () => {
      // Refresh role to make sure we have the latest data
      if (user) {
        await refreshUserRole();
      }
      
      if (!user || (userRole !== 'team_leader' && userRole !== 'admin')) {
        console.log('Access denied to team leader page. User:', user?.id, 'Role:', userRole);
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the team leader dashboard.",
          variant: "destructive"
        });
        navigate('/');
      } else {
        console.log('Team leader access granted for user:', user.id);
      }
    };
    
    checkAccess();
  }, [navigate, toast, user, userRole, refreshUserRole]);

  if (!user || (userRole !== 'team_leader' && userRole !== 'admin')) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
          <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-muted-foreground mb-6">
              You need team leader privileges to access this page.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24 md:py-24">
        <div className="flex items-center mb-8 gap-4">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold animate-fade-in">Team Leader Dashboard</h1>
        </div>
        
        <Tabs defaultValue="team-members" className="w-full">
          <TabsList className="mb-8 grid grid-cols-2 gap-2">
            <TabsTrigger value="team-members" className="flex items-center justify-center">
              <Users className="w-4 h-4 mr-2" />
              <span>Team Members</span>
            </TabsTrigger>
            <TabsTrigger value="team-stats" className="flex items-center justify-center">
              <LineChart className="w-4 h-4 mr-2" />
              <span>Team Statistics</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="team-members" className="space-y-6">
            <TeamMembersList />
          </TabsContent>
          
          <TabsContent value="team-stats" className="space-y-6">
            <TeamPointsOverview />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeamLeaderDashboard;
