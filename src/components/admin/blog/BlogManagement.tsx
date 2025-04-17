
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { useBlogPosts } from '@/hooks/admin/useBlogPosts';
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

const BlogManagement = () => {
  const { posts, isLoading, addPost, updatePost, deletePost } = useBlogPosts();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    is_published: false,
    slug: '',
    author: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_published: checked }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      is_published: false,
      slug: '',
      author: ''
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      title,
      slug: generateSlug(title)
    }));
  };

  const handleAddPost = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    await addPost({
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
      category: formData.category,
      is_published: formData.is_published,
      slug: formData.slug || generateSlug(formData.title),
      author: formData.author
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditPost = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    if (currentPost) {
      await updatePost(currentPost.id, {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category,
        is_published: formData.is_published,
        slug: formData.slug,
        author: formData.author
      });
    }

    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeletePost = async () => {
    if (currentPost) {
      await deletePost(currentPost.id);
    }
    setIsDeleteDialogOpen(false);
  };

  const openEditDialog = (post: any) => {
    setCurrentPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      category: post.category || '',
      is_published: post.is_published,
      slug: post.slug,
      author: post.author || ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (post: any) => {
    setCurrentPost(post);
    setIsDeleteDialogOpen(true);
  };

  const columns = [
    {
      header: "Title",
      accessorKey: "title"
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (row: any) => row.category || "Uncategorized"
    },
    {
      header: "Author",
      accessorKey: "author",
      cell: (row: any) => row.author || "Anonymous"
    },
    {
      header: "Published",
      accessorKey: "is_published",
      cell: (row: any) => row.is_published ? "Yes" : "No"
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: any) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditDialog(row)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(row)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Blog Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create a new blog post</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input 
                  id="slug" 
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="author">Author</Label>
                <Input 
                  id="author" 
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea 
                  id="excerpt" 
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Leave blank to auto-generate from content"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea 
                  id="content" 
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={10}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="publish" 
                  checked={formData.is_published}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="publish">Publish post</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddPost}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <DataTable
        columns={columns}
        data={posts || []}
        isLoading={isLoading}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input 
                id="edit-title" 
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Input 
                id="edit-slug" 
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input 
                id="edit-category" 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-author">Author</Label>
              <Input 
                id="edit-author" 
                name="author"
                value={formData.author}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-excerpt">Excerpt</Label>
              <Textarea 
                id="edit-excerpt" 
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea 
                id="edit-content" 
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={10}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="edit-publish" 
                checked={formData.is_published}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="edit-publish">Publish post</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditPost}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
          </DialogHeader>
          <p className="py-4">Are you sure you want to delete "{currentPost?.title}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePost}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;
