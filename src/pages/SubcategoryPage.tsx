import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/urlUtils';
import { isValidCategorySlug, getCategoriesForSlug, getCategoryDisplayName, getCategorySlug } from '@/utils/categoryMapping';
import { getSubcategory, getSubcategories } from '@/utils/subcategoryConfig';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface QuestionRow {
  id: string;
  question: string;
  difficulty: string | null;
}

const SubcategoryPage: React.FC = () => {
  const { categorySlug, subSlug } = useParams<{ categorySlug: string; subSlug: string }>();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const validParent = !!categorySlug && isValidCategorySlug(categorySlug);
  const sub = validParent && subSlug ? getSubcategory(categorySlug!, subSlug) : undefined;
  const parentName = validParent ? getCategoryDisplayName(categorySlug!) : '';
  const siblings = validParent ? getSubcategories(categorySlug!) : [];

  useEffect(() => {
    const fetch = async () => {
      if (!sub || !categorySlug) return;
      setLoading(true);
      try {
        const baseCats = sub.dbCategories && sub.dbCategories.length > 0
          ? sub.dbCategories
          : getCategoriesForSlug(categorySlug);

        let query = supabase
          .from('quiz_questions')
          .select('id, question, difficulty')
          .in('category', baseCats);

        if (sub.keywords && sub.keywords.length > 0) {
          const or = sub.keywords
            .map((kw) => `question.ilike.%${kw.replace(/[,()]/g, '')}%`)
            .join(',');
          query = query.or(or);
        }

        const { data, error } = await query.limit(200);
        if (error) {
          console.error('Subcategory fetch error:', error);
          setQuestions([]);
        } else {
          setQuestions(data || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [categorySlug, subSlug, sub]);

  if (!validParent || !sub) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEO title="Subcategory Not Found | CuizIN" description="The subcategory you're looking for doesn't exist." noindex />
        <Header />
        <NewsTicker className="mt-16" />
        <main className="flex-1 container max-w-3xl pt-24 pb-16 px-4 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Subcategory Not Found</h1>
          <p className="text-muted-foreground mb-6">"{subSlug}" isn't a known subcategory of "{categorySlug}".</p>
          {validParent && (
            <Button asChild variant="outline">
              <Link to={`/categories/${categorySlug}`}><ChevronLeft className="h-4 w-4 mr-1" />Back to {parentName}</Link>
            </Button>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const title = `${sub.name} Quiz Questions - ${parentName} | CuizIN`;
  const description = `Browse ${questions.length || ''} ${sub.name.toLowerCase()} quiz questions in ${parentName}. Play and test your knowledge on CuizIN.`;
  const canonicalUrl = `https://cuiz.in/categories/${categorySlug}/${subSlug}`;

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.categories(),
    createBreadcrumbs.custom(parentName, `/categories/${categorySlug}`),
    createBreadcrumbs.custom(sub.name, `/categories/${categorySlug}/${subSlug}`),
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${sub.name} - ${parentName}`,
    description,
    url: canonicalUrl,
    numberOfItems: questions.length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={title} description={description} canonicalUrl={canonicalUrl} schemaType="WebPage" schemaData={schema} />
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      <NewsTicker className="mt-16" />

      <main className="flex-1 container max-w-6xl pt-12 pb-16 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/categories">Categories</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/categories/${categorySlug}`}>{parentName}</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{sub.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{sub.name}</h1>
          <p className="text-muted-foreground">
            {parentName} · {loading ? 'Loading…' : `${questions.length} questions`}
          </p>
        </div>

        {siblings.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Button
                key={s.slug}
                asChild
                size="sm"
                variant={s.slug === sub.slug ? 'default' : 'outline'}
              >
                <Link to={`/categories/${categorySlug}/${s.slug}`}>{s.name}</Link>
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground mb-4">No questions yet in this subcategory.</p>
            <Button asChild variant="outline">
              <Link to={`/categories/${categorySlug}`}>Browse all {parentName}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {questions.map((q) => (
              <Card key={q.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link
                    to={`/quiz/question/${q.id}/${categorySlug}/${subSlug}/${createSlug(q.question, 50)}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {q.question}
                  </Link>
                  {q.difficulty && (
                    <div className="mt-2 text-xs text-muted-foreground capitalize">{q.difficulty}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SubcategoryPage;