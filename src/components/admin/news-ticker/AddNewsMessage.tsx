
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface AddNewsMessageProps {
  onMessageAdded: () => void;
  isLoading: boolean;
}

const AddNewsMessage: React.FC<AddNewsMessageProps> = ({ onMessageAdded, isLoading }) => {
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();

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
      const { error } = await supabase
        .from('news_ticker')
        .insert([
          { text: newMessage, is_active: true }
        ]);
        
      if (error) throw error;
      
      setNewMessage('');
      onMessageAdded();
      
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
    }
  };

  return (
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
  );
};

export default AddNewsMessage;
