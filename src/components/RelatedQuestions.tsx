import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowRight, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';
import { getQuestionSubcategorySlug } from '@/utils/subcategoryConfig';

export interface RelatedQuestionItem {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  correctAnswer?: string;
  explanation?: string;
}

interface RelatedQuestionsProps {
  questions: RelatedQuestionItem[];
  currentCategory: string;
  title?: string;
  subtitle?: string;
}

const RelatedQuestions: React.FC<RelatedQuestionsProps> = ({ 
  questions, 
  currentCategory,
  title = "Related Trivia & Knowledge Questions",
  subtitle = "Explore connected questions across this topic to deepen your mastery and test your recall."
}) => {
  if (!questions || questions.length === 0) return null;

  const categorySlug = getCategorySlug(currentCategory);

  return (
    <section className="mt-10" aria-labelledby="related-questions-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 id="related-questions-heading" className="text-xl font-bold flex items-center gap-2 text-foreground">
            <BrainCircuit className="h-5 w-5 text-primary" />
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <Link 
          to={`/categories/${categorySlug}`}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          View all {currentCategory} questions
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {questions.map(q => {
          const catSlug = getCategorySlug(q.category);
          const subSlug = getQuestionSubcategorySlug(q.category, q.question);
          const qSlug = createSlug(q.question, 50);
          const targetUrl = subSlug
            ? `/quiz/question/${q.id}/${catSlug}/${subSlug}/${qSlug}`
            : `/quiz/question/${q.id}/${catSlug}/${qSlug}`;

          return (
            <Card key={q.id} className="p-4 hover:shadow-md hover:border-primary/40 transition-all group flex flex-col justify-between bg-card text-card-foreground">
              <Link to={targetUrl} className="block space-y-2">
                <h3 className="font-semibold text-xs sm:text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {q.question}
                </h3>
                
                {q.correctAnswer && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Ans: <strong className="text-foreground">{q.correctAnswer}</strong></span>
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                    {q.category}
                  </Badge>
                  <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium capitalize ${
                    q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                    q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>
      
      {/* SEO-friendly internal category navigation */}
      <nav className="mt-6 pt-4 border-t border-border" aria-label="Related categories">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Explore Related Categories:</p>
        <div className="flex flex-wrap gap-1.5">
          {['history', 'science', 'geography', 'literature', 'entertainment', 'sports', 'technology', 'general-knowledge']
            .filter(slug => slug !== categorySlug)
            .slice(0, 6)
            .map(slug => (
              <Link
                key={slug}
                to={`/categories/${slug}`}
                className="text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
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
