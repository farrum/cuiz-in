import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminAdManagement from './AdminAdManagement';
import AdminQuizManagement from './AdminQuizManagement';
import AdminBlogManagement from './AdminBlogManagement';
import AdminFaqManagement from './AdminFaqManagement';
import AdminUserManagement from './AdminUserManagement';
import SitemapManagement from './SitemapManagement';

const AdminPage: React.FC = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="quiz-management" className="w-full">
        <TabsList>
          <TabsTrigger value="quiz-management">Quiz</TabsTrigger>
          <TabsTrigger value="blog-management">Blog</TabsTrigger>
          <TabsTrigger value="faq-management">FAQ</TabsTrigger>
          <TabsTrigger value="user-management">Users</TabsTrigger>
           <TabsTrigger value="ad-management">Ads</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
        </TabsList>
        <TabsContent value="quiz-management">
          <AdminQuizManagement />
        </TabsContent>
        <TabsContent value="blog-management">
          <AdminBlogManagement />
        </TabsContent>
        <TabsContent value="faq-management">
          <AdminFaqManagement />
        </TabsContent>
        <TabsContent value="user-management">
          <AdminUserManagement />
        </TabsContent>
        
        <TabsContent value="ad-management">
          <AdminAdManagement />
        </TabsContent>
        
        <TabsContent value="sitemap">
          <SitemapManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
