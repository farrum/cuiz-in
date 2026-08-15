import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import PageLayout from '@/components/layout/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';
import { Loader2 } from 'lucide-react';

interface QuestionEntry {
  id: string;
  question: string;
  category: string;
}

const HtmlSitemapPage: React.FC = () => {
  const [questionsByCategory, setQuestionsByCategory] = useState<Record<string, QuestionEntry[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchAllQuestions = async () => {
      setIsLoading(true);
      try {
        // Fetch all questions in batches to bypass the 1000 row limit
        let allQuestions: QuestionEntry[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('quiz_questions')
            .select('id, question, category')
            .order('category', { ascending: true })
            .order('created_at', { ascending: false })
            .range(from, from + batchSize - 1);

          if (error) {
            console.error('Error fetching questions:', error);
            break;
          }

          if (data && data.length > 0) {
            allQuestions = [...allQuestions, ...data];
            from += batchSize;
            hasMore = data.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        // Group by category
        const grouped: Record<string, QuestionEntry[]> = {};
        allQuestions.forEach(q => {
          const cat = q.category || 'Uncategorized';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(q);
        });

        setQuestionsByCategory(grouped);
        setTotalCount(allQuestions.length);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllQuestions();
  }, []);

  const sortedCategories = Object.keys(questionsByCategory).sort();

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All Quiz Questions - HTML Sitemap',
    description: `Complete directory of ${totalCount.toLocaleString()} quiz questions and answers on CuizIN. Browse all questions by category.`,
    url: 'https://cuiz.in/all-questions',
    numberOfItems: totalCount,
  };

  return (
    <>
      <SEO
        title={`${totalCount.toLocaleString()} Quiz Questions With Answers — Free GK Trivia | CuizIN`}
        description={`Find the answer to any trivia question fast. Search ${totalCount.toLocaleString()} quiz questions with verified answers and explanations across history, science, sports, geography, entertainment and more — free, no signup.`}
        canonicalUrl="https://cuiz.in/all-questions"
        schemaType="WebPage"
        schemaData={pageSchema}
        keywords={['quiz questions', 'trivia questions', 'quiz answers', 'general knowledge', 'trivia quiz', 'CuizIN questions']}
      />
      <PageLayout>
        <main className="flex-1 container max-w-6xl pt-24 pb-16 px-4">
          <h1 className="text-3xl font-bold mb-2">All Quiz Questions & Answers</h1>
          <p className="text-muted-foreground mb-8">
            Complete directory of {totalCount.toLocaleString()} quiz questions across {sortedCategories.length} categories.
          </p>

          {/* Quick navigation by category */}
          {!isLoading && sortedCategories.length > 0 && (
            <nav className="mb-8 p-4 bg-muted/50 rounded-lg" aria-label="Category navigation">
              <h2 className="text-lg font-semibold mb-3">Jump to Category</h2>
              <div className="flex flex-wrap gap-2">
                {sortedCategories.map(cat => (
                  <a
                    key={cat}
                    href={`#cat-${createSlug(cat)}`}
                    className="text-sm px-3 py-1 bg-background border border-border rounded-full hover:bg-accent transition-colors"
                  >
                    {cat} ({questionsByCategory[cat].length})
                  </a>
                ))}
              </div>
            </nav>
          )}

          {/* Static pages section */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Site Pages</h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <li><Link to="/" className="text-primary hover:underline">Home</Link></li>
              <li><Link to="/quiz" className="text-primary hover:underline">Play Quiz</Link></li>
              <li><Link to="/categories" className="text-primary hover:underline">Categories</Link></li>
              <li><Link to="/browse" className="text-primary hover:underline">Browse Questions</Link></li>
              <li><Link to="/blog" className="text-primary hover:underline">Blog</Link></li>
              <li><Link to="/faq" className="text-primary hover:underline">FAQ</Link></li>
              <li><Link to="/how-to-play" className="text-primary hover:underline">How to Play</Link></li>
              <li><Link to="/referral-program" className="text-primary hover:underline">Referral Program</Link></li>
              <li><Link to="/topics" className="text-primary hover:underline">Quiz Topics</Link></li>
              <li><Link to="/stories" className="text-primary hover:underline">Quiz Stories</Link></li>
              <li><Link to="/terms" className="text-primary hover:underline">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link></li>
              <li><Link to="/disclaimer" className="text-primary hover:underline">Disclaimer</Link></li>
              <li><Link to="/login" className="text-primary hover:underline">Login</Link></li>
              <li><Link to="/register" className="text-primary hover:underline">Register</Link></li>
            </ul>
          </section>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading all questions...</span>
            </div>
          ) : (
            sortedCategories.map(category => (
              <section key={category} className="mb-10" id={`cat-${createSlug(category)}`}>
                <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2 sticky top-16 bg-background z-10">
                  {category} <span className="text-muted-foreground text-sm font-normal">({questionsByCategory[category].length} questions)</span>
                </h2>
                <ul className="space-y-1 text-sm">
                  {questionsByCategory[category].map(q => {
                    const questionSlug = createSlug(q.question);
                    return (
                      <li key={q.id} className="py-1 border-b border-border/30">
                        <Link
                          to={`/quiz/question/${q.id}/${getCategorySlug(category)}/${questionSlug}`}
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          {q.question}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </main>
      </PageLayout>
    </>
  );
};

export default HtmlSitemapPage;
