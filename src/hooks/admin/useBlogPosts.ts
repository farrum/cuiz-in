
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  slug?: string;
  author?: string;
  published_at?: string;
  is_published: boolean;
}

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({
        title: 'Error',
        description: 'Unable to load blog posts. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addPost = async (post: Omit<BlogPost, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([post])
        .select();

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Blog post added successfully',
      });
      
      await fetchPosts();
      return data;
    } catch (error) {
      console.error('Error adding blog post:', error);
      toast({
        title: 'Error',
        description: 'Failed to add blog post',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updatePost = async (id: string, updates: Partial<BlogPost>) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Blog post updated successfully',
      });
      
      await fetchPosts();
      return true;
    } catch (error) {
      console.error('Error updating blog post:', error);
      toast({
        title: 'Error',
        description: 'Failed to update blog post',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      });
      
      await fetchPosts();
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete blog post',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    isLoading,
    addPost,
    updatePost,
    deletePost,
    refreshPosts: fetchPosts
  };
};
