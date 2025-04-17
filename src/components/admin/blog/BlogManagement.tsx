
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useBlogPosts } from '@/hooks/admin/useBlogPosts';

const BlogManagement = () => {
  const { posts, isLoading } = useBlogPosts();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Blog Posts</h2>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {posts?.map((post) => (
            <div key={post.id} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{post.title}</h3>
              <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogManagement;
