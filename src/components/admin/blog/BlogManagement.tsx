
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useBlogPosts } from '@/hooks/admin/useBlogPosts';
import { triggerDailyBlogGeneration } from '@/utils/triggerDailyBlog';
import { Loader2, Plus, RefreshCw, Robot } from 'lucide-react';

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

const BlogManagement = () => {
  const { toast } = useToast();
  const { posts, isLoading, addPost, updatePost, deletePost, refreshPosts } = useBlogPosts();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateRandomPost = async () => {
    setIsGenerating(true);
    try {
      const result = await triggerDailyBlogGeneration();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "New blog post generated successfully.",
        });
        refreshPosts();
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to generate blog post",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Blog Management</h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateRandomPost} 
            disabled={isGenerating}
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Robot className="mr-2 h-4 w-4" />
            )}
            Generate Random Post
          </Button>
          <Button onClick={() => refreshPosts()} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Post
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <h3 className="text-lg font-medium">No blog posts found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first blog post to get started
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {post.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {post.category || "Uncategorized"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {post.author || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      post.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(post.published_at || post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;
