
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Megaphone, Plus, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface NewsMessage {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

const NewsTickerAdmin: React.FC = () => {
  const [messages, setMessages] = useState<NewsMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const { toast } = useToast();

  // Load messages
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('news_ticker')
        .select('*')
        .order('created_at', { ascending: false }) as unknown as { 
          data: NewsMessage[] | null, 
          error: Error | null 
        };
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching news ticker messages:', error);
      toast({
        title: "Error",
        description: "Failed to load news ticker messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('news_ticker_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'news_ticker'
      }, () => {
        fetchMessages();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Add a new message
  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('news_ticker')
        .insert([
          { text: newMessage, is_active: true }
        ]);
        
      if (error) throw error;
      
      setNewMessage('');
      fetchMessages();
      
      toast({
        title: "Success",
        description: "News ticker message added successfully",
      });
    } catch (error) {
      console.error('Error adding news ticker message:', error);
      toast({
        title: "Error",
        description: "Failed to add news ticker message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle message active status
  const toggleMessageStatus = async (id: string, currentStatus: boolean) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('news_ticker')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setMessages(messages.map(message => 
        message.id === id ? { ...message, is_active: !currentStatus } : message
      ));
      
      toast({
        title: "Success",
        description: `Message ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling message status:', error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a message
  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('news_ticker')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setMessages(messages.filter(message => message.id !== id));
      
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
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing a message
  const startEdit = (message: NewsMessage) => {
    setIsEditing(message.id);
    setEditText(message.text);
  };

  // Save edited message
  const saveEdit = async () => {
    if (!isEditing) return;
    
    if (!editText.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('news_ticker')
        .update({ text: editText })
        .eq('id', isEditing);
        
      if (error) throw error;
      
      // Update local state
      setMessages(messages.map(message => 
        message.id === isEditing ? { ...message, text: editText } : message
      ));
      
      setIsEditing(null);
      setEditText('');
      
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
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setIsEditing(null);
    setEditText('');
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Megaphone className="mr-2 h-6 w-6" />
            News Ticker Management
          </h1>
          <p className="text-muted-foreground">
            Manage the scrolling messages that appear at the top of the application
          </p>
        </div>
        <Button 
          onClick={fetchMessages} 
          variant="outline" 
          disabled={isLoading}
          className="flex items-center"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Message</CardTitle>
          <CardDescription>
            Create a new announcement to display in the news ticker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMessage} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="new-message">Message Text</Label>
              <Textarea
                id="new-message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter message text..."
                className="resize-none"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !newMessage.trim()} 
              className="self-start"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Message
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Message List</CardTitle>
          <CardDescription>
            All news ticker messages in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && messages.length === 0 ? (
            <div className="text-center p-4">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center p-4 border rounded-md bg-muted/50">
              <p>No messages found. Add your first announcement above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className="border rounded-md p-4 hover:bg-accent/10 transition-colors"
                >
                  {isEditing === message.id ? (
                    <div className="space-y-3">
                      <Textarea 
                        value={editText} 
                        onChange={(e) => setEditText(e.target.value)}
                        className="resize-none" 
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}>Save</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
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
                              onCheckedChange={() => toggleMessageStatus(message.id, message.is_active)}
                              disabled={isLoading}
                            />
                            <Label htmlFor={`active-${message.id}`} className="text-sm">
                              {message.is_active ? 'Active' : 'Inactive'}
                            </Label>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => startEdit(message)}
                            title="Edit message"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMessage(message.id)}
                            title="Delete message"
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
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
                          variant={message.is_active ? "success" : "secondary"}
                          className={message.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {message.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsTickerAdmin;
