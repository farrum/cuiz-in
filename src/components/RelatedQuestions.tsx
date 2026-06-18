import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';

interface RelatedQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface RelatedQuestionsProps {
  questions: RelatedQuestion[];
  currentCategory: string;
  title?: string;
}

const RelatedQuestions: React.FC<RelatedQuestionsProps> = ({ 
  questions, 
  currentCategory,
  title = "More Questions to Explore"
}) => {
  if (!questions || questions.length === 0) return null;

  const categorySlug = getCategorySlug(currentCategory);

  return (
    <section className="mt-8" aria-labelledby="related-questions-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="related-questions-heading" className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {title}
        </h2>
        <Link 
          to={`/categories/${categorySlug}`}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View all {currentCategory} questions
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {questions.map(q => (
          <Card key={q.id} className="p-4 hover:shadow-md transition-shadow group">
            <Link 
              to={`/quiz/question/${q.id}/${getCategorySlug(q.category)}/${createSlug(q.question, 50)}`}
              className="block"
            >
              <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                {q.question}
              </h3>
              <div className="flex gap-2 mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                  {q.category}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  q.difficulty === 'easy' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                  q.difficulty === 'medium' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                  'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {q.difficulty}
                </span>
              </div>
            </Link>
          </Card>
        ))}
      </div>
      
      {/* SEO-friendly internal links */}
      <nav className="mt-6 pt-4 border-t" aria-label="Related categories">
        <p className="text-sm text-muted-foreground mb-2">Explore more categories:</p>
        <div className="flex flex-wrap gap-2">
          {['history', 'science', 'geography', 'literature', 'entertainment', 'sports', 'technology', 'general-knowledge']
            .filter(slug => slug !== categorySlug)
            .slice(0, 5)
            .map(slug => (
              <Link
                key={slug}
                to={`/categories/${slug}`}
                className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Link>
            ))
          }
        </div>
      </nav>
    </section>
  );
};

export default RelatedQuestions;
