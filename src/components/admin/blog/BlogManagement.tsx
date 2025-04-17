
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useBlogPosts } from '@/hooks/admin/useBlogPosts';
import { triggerDailyBlogGeneration } from '@/utils/triggerDailyBlog';
import { Loader2, Plus, RefreshCw, Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  slug?: string;
  author?: string;
  published_at?: string;
  created_at?: string;
  is_published: boolean;
}

const BlogManagement = () => {
  const { toast } = useToast();
  const { posts, isLoading, addPost, updatePost, deletePost, refreshPosts } = useBlogPosts();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    category: 'General',
    author: 'CuizIN Team',
    is_published: true
  });
  
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 100) // Limit length
      + '-' + new Date().getTime().toString().slice(-4); // Add timestamp for uniqueness
  };

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

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    // Generate slug from title
    const slug = generateSlug(newPost.title);
    
    try {
      const result = await addPost({
        ...newPost,
        slug,
        is_published: newPost.is_published ?? true
      } as BlogPost);
      
      if (result) {
        setIsAddDialogOpen(false);
        setNewPost({
          title: '',
          content: '',
          excerpt: '',
          category: 'General',
          author: 'CuizIN Team',
          is_published: true
        });
        refreshPosts();
      }
    } catch (error) {
      console.error('Error adding blog post:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPost(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate excerpt from title if excerpt is empty and title is being changed
    if (name === 'title' && (!newPost.excerpt || newPost.excerpt === '')) {
      setNewPost(prev => ({ ...prev, excerpt: value.substring(0, 100) }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewPost(prev => ({ ...prev, [name]: checked }));
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
              <Bot className="mr-2 h-4 w-4" />
            )}
            Generate Random Post
          </Button>
          <Button onClick={() => refreshPosts()} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
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
                    {new Date(post.published_at || post.created_at || '').toLocaleDateString()}
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

      {/* Add New Blog Post Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Blog Post</DialogTitle>
            <DialogDescription>
              Create a new blog post to share with your readers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                name="title"
                value={newPost.title}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Enter blog post title"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Input
                id="category"
                name="category"
                value={newPost.category}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="E.g., Quiz Tips, Learning, Updates"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="author" className="text-right">Author</Label>
              <Input
                id="author"
                name="author"
                value={newPost.author}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Author name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="excerpt" className="text-right pt-2">Excerpt</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                value={newPost.excerpt}
                onChange={handleInputChange}
                className="col-span-3 h-20"
                placeholder="Short description for blog listings (automatically generated from title if left empty)"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="content" className="text-right pt-2">Content</Label>
              <Textarea
                id="content"
                name="content"
                value={newPost.content}
                onChange={handleInputChange}
                className="col-span-3 h-40"
                placeholder="Write your blog content here (Markdown supported)"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="flex items-center gap-2 col-span-3">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={newPost.is_published}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_published" className="text-sm font-normal">
                  Publish immediately
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPost}>
              Add Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;
