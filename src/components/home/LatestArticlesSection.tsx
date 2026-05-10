import React from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '@/utils/blogData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';

const LatestArticlesSection: React.FC = () => {
  // Get the 3 most recent articles
  const recentArticles = blogPosts.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Latest Articles
          </h2>
          <p className="text-muted-foreground mt-2">
            Expand your knowledge with our latest educational guides and trivia facts.
          </p>
        </div>
        <Button variant="outline" asChild className="hidden sm:flex">
          <Link to="/blog">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {recentArticles.map(post => (
          <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="text-sm text-muted-foreground mb-2">{post.category} • {new Date(post.date).toLocaleDateString()}</div>
              <CardTitle className="text-xl line-clamp-2">
                <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="text-base line-clamp-3">
                {post.excerpt}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">{post.author}</span>
              <span className="text-sm text-muted-foreground">{post.readTime}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Button variant="outline" asChild className="w-full mt-6 sm:hidden">
        <Link to="/blog">
          View All Articles <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};

export default LatestArticlesSection;
