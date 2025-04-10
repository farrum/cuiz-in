
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Check, X, RefreshCw } from 'lucide-react';
import { ProfileIconUploader } from './ProfileIconUploader';
import { STORAGE_KEYS } from '@/utils/quizData';

interface ProfileIcon {
  id: string;
  name: string;
  icon_url: string;
  is_active: boolean;
  created_at?: string;
}

const ProfileIconsManagement: React.FC = () => {
  const [icons, setIcons] = useState<ProfileIcon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchIcons();
  }, []);
  
  const fetchIcons = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profile_icons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setIcons(data || []);
    } catch (error: any) {
      console.error('Error fetching icons:', error);
      toast({
        title: 'Error',
        description: `Failed to load profile icons: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const toggleIconStatus = async (icon: ProfileIcon) => {
    try {
      const { error } = await supabase
        .from('profile_icons')
        .update({ is_active: !icon.is_active })
        .eq('id', icon.id);
        
      if (error) throw error;
      
      // Update local state
      setIcons(icons.map(i => 
        i.id === icon.id 
          ? { ...i, is_active: !i.is_active } 
          : i
      ));
      
      toast({
        title: 'Success',
        description: `Icon "${icon.name}" ${icon.is_active ? 'deactivated' : 'activated'}.`
      });
    } catch (error: any) {
      console.error('Error updating icon status:', error);
      toast({
        title: 'Error',
        description: `Failed to update icon status: ${error.message}`,
        variant: 'destructive'
      });
    }
  };
  
  const deleteIcon = async (icon: ProfileIcon) => {
    if (!confirm(`Are you sure you want to delete the icon "${icon.name}"?`)) {
      return;
    }
    
    try {
      // Ensure admin session authentication
      const isAdminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
      if (!isAdminAuth) {
        throw new Error("Admin authentication required");
      }
      
      try {
        // Try using the admin_delete_profile_icon function first
        const { data, error } = await supabase
          .rpc('admin_delete_profile_icon', {
            p_icon_id: icon.id
          });
          
        if (error) throw error;
        
        // If the function returns false, the icon wasn't found
        if (data === false) {
          throw new Error("Icon not found");
        }
      } catch (rpcError: any) {
        console.error('RPC delete failed, trying direct delete:', rpcError);
        
        // Fallback to direct delete if the RPC method fails
        const { error: directError } = await supabase
          .from('profile_icons')
          .delete()
          .eq('id', icon.id);
          
        if (directError) {
          throw directError;
        }
      }
      
      // Update local state
      setIcons(icons.filter(i => i.id !== icon.id));
      
      toast({
        title: 'Success',
        description: `Icon "${icon.name}" has been deleted.`
      });
    } catch (error: any) {
      console.error('Error deleting icon:', error);
      toast({
        title: 'Error',
        description: `Failed to delete icon: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileIconUploader />
        
        <Card>
          <CardHeader>
            <CardTitle>Manage Profile Icons</CardTitle>
            <CardDescription>
              View, activate/deactivate, or delete profile icons
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : icons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No profile icons found. Upload some icons to get started.
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {icons.map(icon => (
                  <div 
                    key={icon.id} 
                    className="flex items-center space-x-3 border rounded-md p-3"
                  >
                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border bg-background">
                      <img 
                        src={icon.icon_url} 
                        alt={icon.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlLW9mZiI+PHBhdGggZD0iTTE4LjM2OSA1LjYzMUwzLjYzMSAyMC4zNjlBMiAyIDAgMSAxIDMuNjMxIDEuNjMxTDE4LjM2OSAxNi4zNjlBMiAyIDAgMSAxIDE4LjM2OSAxLjYzMSIvPjwvc3ZnPg==';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{icon.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {icon.is_active ? (
                          <span className="flex items-center text-green-600">
                            <Check className="w-3 h-3 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <X className="w-3 h-3 mr-1" /> Inactive
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant={icon.is_active ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleIconStatus(icon)}
                      >
                        {icon.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteIcon(icon)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Button onClick={() => fetchIcons()} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh Icons
      </Button>
    </div>
  );
};

export default ProfileIconsManagement;
