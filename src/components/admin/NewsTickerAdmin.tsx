
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, PencilLine, Plus, Save, X } from 'lucide-react';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { useToast } from '@/hooks/use-toast';

interface NewsTickerMessage {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

const NewsTickerAdmin = () => {
  const [messages, setMessages] = useState<NewsTickerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      // Using type assertion to handle the news_ticker table that's not yet in the TypeScript types
      const { data, error } = await supabase
        .from('news_ticker')
        .select('*')
        .order('created_at', { ascending: false }) as unknown as { 
          data: NewsTickerMessage[] | null, 
          error: Error | null 
        };

      if (error) {
        console.error('Error fetching news ticker messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (err) {
      console.error('Failed to fetch news ticker messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Using type assertion for the insert operation
      const { error } = await supabase
        .from('news_ticker')
        .insert([{ text: newMessage.trim(), is_active: true }]) as unknown as {
          error: Error | null;
        };

      if (error) {
        console.error('Error adding message:', error);
        toast({
          title: 'Error',
          description: 'Failed to add message',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Message added successfully',
      });
      
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to add message:', err);
      toast({
        title: 'Error',
        description: 'Failed to add message',
        variant: 'destructive',
      });
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      // Using type assertion for the delete operation
      const { error } = await supabase
        .from('news_ticker')
        .delete()
        .eq('id', id) as unknown as {
          error: Error | null;
        };

      if (error) {
        console.error('Error deleting message:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete message',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Message deleted successfully',
      });
      
      fetchMessages();
    } catch (err) {
      console.error('Failed to delete message:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (message: NewsTickerMessage) => {
    setEditingId(message.id);
    setEditText(message.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;

    try {
      // Using type assertion for the update operation
      const { error } = await supabase
        .from('news_ticker')
        .update({ text: editText.trim() })
        .eq('id', editingId) as unknown as {
          error: Error | null;
        };

      if (error) {
        console.error('Error updating message:', error);
        toast({
          title: 'Error',
          description: 'Failed to update message',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Message updated successfully',
      });
      
      setEditingId(null);
      setEditText('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to update message:', err);
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // Using type assertion for the update operation
      const { error } = await supabase
        .from('news_ticker')
        .update({ is_active: !currentStatus })
        .eq('id', id) as unknown as {
          error: Error | null;
        };

      if (error) {
        console.error('Error toggling message status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update message status',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: `Message ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchMessages();
    } catch (err) {
      console.error('Failed to toggle message status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update message status',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      header: 'Message',
      accessorKey: 'text',
      cell: ({ row }: any) => {
        const message = row.original;
        return editingId === message.id ? (
          <div className="flex gap-2 items-center">
            <Input 
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={saveEdit} variant="outline">
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={cancelEdit} variant="outline">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className={message.is_active ? 'font-normal' : 'text-muted-foreground line-through'}>
            {message.text}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: ({ row }: any) => {
        const message = row.original;
        return (
          <Button
            variant={message.is_active ? "default" : "outline"}
            size="sm"
            onClick={() => toggleActive(message.id, message.is_active)}
          >
            {message.is_active ? 'Active' : 'Inactive'}
          </Button>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ row }: any) => {
        const message = row.original;
        return (
          <div className="flex gap-2">
            {editingId !== message.id && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => startEdit(message)}
              >
                <PencilLine className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => deleteMessage(message.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">News Ticker Management</h2>
        <p className="text-muted-foreground mb-4">
          Add announcements that will be shown to logged-in users across the app.
        </p>
      </div>
      
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Enter news message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1"
        />
        <Button onClick={addMessage}>
          <Plus className="h-4 w-4 mr-2" />
          Add Message
        </Button>
      </div>

      <PaginatedDataTable
        columns={columns}
        data={messages}
        pageSize={5}
        isLoading={isLoading}
      />
    </div>
  );
};

export default NewsTickerAdmin;
