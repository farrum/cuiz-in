import React from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '@/utils/blogData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface RelatedArticlesProps {
  currentCategory?: string;
  limit?: number;
}

const RelatedArticles: React.FC<RelatedArticlesProps> = ({ currentCategory, limit = 2 }) => {
  // Try to find articles matching the category
  let relatedPosts = blogPosts.filter(post => post.category === currentCategory);
  
  // If not enough matching category, fill with random/latest
  if (relatedPosts.length < limit) {
    const otherPosts = blogPosts.filter(post => post.category !== currentCategory);
    relatedPosts = [...relatedPosts, ...otherPosts.slice(0, limit - relatedPosts.length)];
  } else {
    relatedPosts = relatedPosts.slice(0, limit);
  }

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-8 bg-card rounded-lg p-6 border shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        Further Reading
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Deepen your knowledge with our related educational articles:
      </p>
      
      <div className="grid gap-4 md:grid-cols-2">
        {relatedPosts.map(post => (
          <Card key={post.id} className="overflow-hidden hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="text-xs text-muted-foreground mb-1">{post.category}</div>
              <CardTitle className="text-base line-clamp-2">
                <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-sm line-clamp-2">
                {post.excerpt}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link to="/blog" className="text-sm text-primary hover:underline font-medium">
          View all educational articles &rarr;
        </Link>
      </div>
    </div>
  );
};

export default RelatedArticles;
