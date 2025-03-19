
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Trash2, Plus, Sparkles, Frown, Trophy, MessageCircleHeart } from 'lucide-react';
import { FunMessage, MessageType, getDefaultMessages } from '@/utils/funMessages';

const FunMessagesAdmin: React.FC = () => {
  const [messages, setMessages] = useState<FunMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [newEmoji, setNewEmoji] = useState<string>('');
  const [messageType, setMessageType] = useState<MessageType>('success');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchMessages();
  }, []);
  
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fun_messages')
        .select('*')
        .order('createdAt', { ascending: false });
        
      if (error) throw error;
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fun messages',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const addMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsSaving(true);
    
    try {
      const newFunMessage: Omit<FunMessage, 'id'> = {
        type: messageType,
        text: newMessage.trim(),
        emoji: newEmoji.trim() || undefined,
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      
      const { data, error } = await supabase
        .from('fun_messages')
        .insert([newFunMessage])
        .select();
        
      if (error) throw error;
      
      setMessages([...(data || []), ...messages]);
      setNewMessage('');
      setNewEmoji('');
      
      toast({
        title: 'Success',
        description: 'Fun message added successfully!',
        variant: 'default',
      });
      
      fetchMessages();
      
    } catch (error) {
      console.error('Error adding message:', error);
      toast({
        title: 'Error',
        description: 'Failed to add fun message',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fun_messages')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setMessages(messages.filter(msg => msg.id !== id));
      
      toast({
        title: 'Success',
        description: 'Message deleted successfully',
        variant: 'default',
      });
      
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };
  
  const resetToDefaultMessages = async () => {
    try {
      // Get default messages for all types
      const allDefaultMessages = [
        ...getDefaultMessages('success'),
        ...getDefaultMessages('failure'),
        ...getDefaultMessages('achievement'),
        ...getDefaultMessages('welcome'),
        ...getDefaultMessages('level_up')
      ];
      
      // Delete all existing messages
      const { error: deleteError } = await supabase
        .from('fun_messages')
        .delete()
        .neq('id', '0'); // Delete all records
        
      if (deleteError) throw deleteError;
      
      // Insert all default messages
      const { error: insertError } = await supabase
        .from('fun_messages')
        .insert(allDefaultMessages.map(msg => ({
          type: msg.type,
          text: msg.text,
          emoji: msg.emoji,
          createdAt: new Date().toISOString(),
          isActive: true
        })));
        
      if (insertError) throw insertError;
      
      toast({
        title: 'Success',
        description: 'Reset to default messages successfully',
        variant: 'default',
      });
      
      fetchMessages();
      
    } catch (error) {
      console.error('Error resetting messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset messages',
        variant: 'destructive',
      });
    }
  };
  
  const getTypeIcon = (type: MessageType) => {
    switch (type) {
      case 'success': return <Sparkles className="h-5 w-5 text-green-500" />;
      case 'failure': return <Frown className="h-5 w-5 text-red-500" />;
      case 'achievement': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'welcome': return <MessageCircleHeart className="h-5 w-5 text-blue-500" />;
      case 'level_up': return <MessageSquare className="h-5 w-5 text-purple-500" />;
      default: return <MessageSquare className="h-5 w-5" />;
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Fun Messages Management
        </CardTitle>
        <CardDescription>
          Create and manage fun messages shown to users during quizzes
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Add New Fun Message</h3>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="messageType">Message Type</Label>
                <Select 
                  value={messageType} 
                  onValueChange={(value) => setMessageType(value as MessageType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="level_up">Level Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="message">Message Text</Label>
                <Textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter a fun message"
                  className="resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="emoji">Emoji (Optional)</Label>
                <Input
                  id="emoji"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  placeholder="🎉 🎊 🥳 etc."
                />
              </div>
              
              <Button 
                onClick={addMessage} 
                disabled={!newMessage.trim() || isSaving}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isSaving ? 'Adding...' : 'Add New Message'}
              </Button>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Existing Messages</h3>
              <Button variant="outline" onClick={resetToDefaultMessages}>
                Reset to Defaults
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary animate-spin rounded-full mx-auto" />
                <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No messages added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getTypeIcon(msg.type)}</div>
                      <div>
                        <div className="font-medium">{msg.text}</div>
                        <div className="text-sm text-muted-foreground">
                          {msg.emoji && <span className="mr-2">{msg.emoji}</span>}
                          Type: {msg.type}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMessage(msg.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Messages are shown to users during quizzes based on their performance
        </p>
      </CardFooter>
    </Card>
  );
};

export default FunMessagesAdmin;
