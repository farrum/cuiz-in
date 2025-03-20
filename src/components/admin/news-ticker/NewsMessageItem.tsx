
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface NewsMessage {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

interface NewsMessageItemProps {
  message: NewsMessage;
  onMessageUpdated: () => void;
  isLoading: boolean;
}

const NewsMessageItem: React.FC<NewsMessageItemProps> = ({ 
  message, 
  onMessageUpdated, 
  isLoading 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const { toast } = useToast();

  const toggleMessageStatus = async () => {
    try {
      const { error } = await supabase
        .from('news_ticker')
        .update({ is_active: !message.is_active })
        .eq('id', message.id);
        
      if (error) throw error;
      
      onMessageUpdated();
      
      toast({
        title: "Success",
        description: `Message ${!message.is_active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling message status:', error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive"
      });
    }
  };

  const deleteMessage = async () => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const { error } = await supabase
        .from('news_ticker')
        .delete()
        .eq('id', message.id);
        
      if (error) throw error;
      
      onMessageUpdated();
      
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  const startEdit = () => {
    setIsEditing(true);
    setEditText(message.text);
  };

  const saveEdit = async () => {
    if (!editText.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('news_ticker')
        .update({ text: editText })
        .eq('id', message.id);
        
      if (error) throw error;
      
      setIsEditing(false);
      onMessageUpdated();
      
      toast({
        title: "Success",
        description: "Message updated successfully",
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };

  return (
    <div className="border rounded-md p-4 hover:bg-accent/10 transition-colors">
      {isEditing ? (
        <div className="space-y-3">
          <Textarea 
            value={editText} 
            onChange={(e) => setEditText(e.target.value)}
            className="resize-none" 
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} disabled={isLoading}>Save</Button>
            <Button size="sm" variant="outline" onClick={cancelEdit} disabled={isLoading}>Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <p className="font-medium">{message.text}</p>
            <div className="flex items-center gap-3 ml-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id={`active-${message.id}`} 
                  checked={message.is_active}
                  onCheckedChange={toggleMessageStatus}
                  disabled={isLoading}
                />
                <Label htmlFor={`active-${message.id}`} className="text-sm">
                  {message.is_active ? 'Active' : 'Inactive'}
                </Label>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={startEdit}
                title="Edit message"
                disabled={isLoading}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={deleteMessage}
                title="Delete message"
                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-xs text-muted-foreground">
              Created: {new Date(message.created_at).toLocaleString()}
            </span>
            <Badge 
              variant={message.is_active ? "secondary" : "outline"}
              className={message.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
            >
              {message.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </>
      )}
    </div>
  );
};

export default NewsMessageItem;
