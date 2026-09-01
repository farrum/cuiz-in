
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Ban, Key, Search, UserCheck, User, RefreshCw } from 'lucide-react';

interface AdminUserManagementEnhancedProps {
  onResetPassword: (userId: string) => void;
  onUserSelect: (userId: string) => void;
}

const AdminUserManagementEnhanced: React.FC<AdminUserManagementEnhancedProps> = ({
  onResetPassword,
  onUserSelect
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      // Prefer the real Supabase session; fall back to legacy admin id
      const { data: { session } } = await supabase.auth.getSession();
      const adminUserId = session?.user?.id || localStorage.getItem('quiz_app_user_id');

      // Not signed in — don't call the admin function (it would 401)
      if (!adminUserId) {
        setUsers([]);
        toast({
          title: 'Session expired',
          description: 'Please sign in as an admin to view users.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-get-users', {
        body: { adminUserId },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      const rawUsers = data?.users || [];

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles' as any)
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      const rolesMap = new Map<string, string>();
      if (rolesData) {
        rolesData.forEach((r: any) => rolesMap.set(r.user_id, r.role));
      }

      // Today's activity comes from the edge function (single source of truth)
      const mappedUsers = rawUsers.map((u: any) => ({
        ...u,
        role: rolesMap.get(u.id) || 'infantry',
        questions_today: Number(u.questions_today ?? 0),
        questions_quest_today: Number(u.questions_quest_today ?? 0),
        gems_today: Number(u.gems_today ?? 0),
      }));

      setUsers(mappedUsers);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      // 1. Delete existing roles (except admin)
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .neq('role', 'admin');
        
      if (deleteError) throw deleteError;

      // 2. Insert the new rank manually
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole,
          is_manual: true
        });

      if (insertError) throw insertError;

      toast({
        title: 'Rank Adjusted',
        description: `Successfully adjusted user rank to ${newRole}.`,
      });
      fetchUsers();
    } catch (e: any) {
      toast({
        title: 'Failed to Update Role',
        description: e.message || 'Failed to update role.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      // Call edge function - include adminUserId for legacy auth
      const adminId = localStorage.getItem('quiz_app_user_id');
      const { error } = await supabase.functions.invoke('admin-update-user', {
        body: { 
          userId,
          updates: { suspended: !currentStatus },
          adminUserId: adminId
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${currentStatus ? 'unsuspended' : 'suspended'} successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error toggling user suspension:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      header: 'User',
      accessorKey: 'username',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.profile_picture} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{row.display_name || row.username}</span>
              {row.provider === 'google' && (
                <Badge 
                  variant="outline" 
                  className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold flex items-center hover:bg-blue-500/20 transition-all duration-300"
                >
                  <svg className="h-2.5 w-2.5 mr-1" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>@{row.username}</span>
              {row.email && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="opacity-80 select-all">{row.email}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row: any) => row.phone || '-'
    },
    {
      header: 'Rank',
      accessorKey: 'role',
      cell: (row: any) => (
        <select
          onChange={(e) => handleChangeRole(row.id, e.target.value)}
          value={row.role}
          className="bg-background border border-input rounded px-1.5 py-0.5 text-xs outline-none uppercase font-bold"
        >
          <option value="infantry">Infantry</option>
          <option value="officer">Officer</option>
          <option value="knight">Knight</option>
          <option value="baron">Baron</option>
          <option value="admin">Admin</option>
        </select>
      )
    },
    {
      header: 'Gems (Total)',
      accessorKey: 'gems',
      cell: (row: any) => (
        <Badge variant="secondary">{row.gems}</Badge>
      )
    },
    {
      header: 'Gems Today',
      accessorKey: 'gems_today',
      cell: (row: any) => {
        const today = Number(row.gems_today || 0);
        return (
          <Badge
            variant={today > 0 ? 'default' : 'secondary'}
            className={today > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5' : 'text-muted-foreground font-medium px-2 py-0.5'}
          >
            {today}
          </Badge>
        );
      }
    },
    {
      header: 'Questions Today',
      accessorKey: 'questions_today',
      cell: (row: any) => {
        const count = Number(row.questions_today || 0);
        const quest = Number(row.questions_quest_today || 0);
        return (
          <div className="flex items-center gap-1" title={`${count} attempted today (${quest} from quests/challenges)`}>
            <Badge
              variant={count > 0 ? "default" : "secondary"}
              className={count > 0 ? "bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-2 py-0.5" : "text-muted-foreground font-medium px-2 py-0.5"}
            >
              {count}
            </Badge>
            {quest > 0 && (
              <span className="text-xs text-muted-foreground">+{quest} quest</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'suspended',
      cell: (row: any) => (
        <Badge variant={row.suspended ? 'destructive' : 'success'}>
          {row.suspended ? 'Suspended' : 'Active'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUserSelect(row.id)}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleUserSuspension(row.id, row.suspended)}
          >
            {row.suspended ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onResetPassword(row.id)}
          >
            <Key className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const normalize = (v: unknown) =>
    String(v ?? '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const terms = normalize(searchTerm).split(' ').filter(Boolean);

  const filteredUsers = users.filter((user) => {
    if (terms.length === 0) return true;
    const haystack = [
      user.username,
      user.display_name,
      user.email,
      user.phone,
      user.id,
    ]
      .map(normalize)
      .join(' ');
    const compact = haystack.replace(/\s+/g, '');
    return terms.every((t) => haystack.includes(t) || compact.includes(t.replace(/\s+/g, '')));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 pb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-[300px]"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Not loaded yet'}
          </span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-current"
            />
            Auto refresh
          </label>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <PaginatedDataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        pageSize={10}
        searchPlaceholder="Search users..."
      />
    </div>
  );
};

export default AdminUserManagementEnhanced;
