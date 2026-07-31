import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import PageLayout from '@/components/layout/PageLayout';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/urlUtils';
import { Loader2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface GkQuestion {
  id: string;
  question: string;
  correct_answer: string;
  explanation: string | null;
  category: string;
}

const SECTIONS: { slug: string; title: string; blurb: string; categories: string[] }[] = [
  {
    slug: 'history',
    title: 'History GK Questions with Answers',
    blurb:
      'Ancient, medieval and modern history questions that repeat in SSC, UPSC, Railway and state-level exams.',
    categories: ['History', 'Indian History'],
  },
  {
    slug: 'geography',
    title: 'Geography GK Questions with Answers',
    blurb:
      'Rivers, mountains, capitals, climate and Indian physical geography — the highest-scoring static GK section.',
    categories: ['Geography'],
  },
  {
    slug: 'science',
    title: 'Science GK Questions with Answers',
    blurb:
      'Physics, chemistry, biology and everyday science questions frequently asked in competitive exams.',
    categories: ['Science', 'Science & Nature', 'Science: Mathematics', 'Mathematics'],
  },
  {
    slug: 'technology',
    title: 'Computer & Technology GK Questions',
    blurb: 'Computer fundamentals, internet and technology awareness questions for banking and SSC exams.',
    categories: ['Technology', 'Science: Computers', 'Science and Technology', 'Science & Technology'],
  },
  {
    slug: 'sports',
    title: 'Sports GK Questions with Answers',
    blurb: 'Olympics, cricket, trophies and sporting records that regularly appear in general awareness papers.',
    categories: ['Sports'],
  },
  {
    slug: 'general-knowledge',
    title: 'Mixed General Knowledge Questions',
    blurb: 'A mixed static GK set covering polity, economy, awards, books and everyday awareness.',
    categories: ['General Knowledge'],
  },
];

const PER_SECTION = 15;

const FAQS = [
  {
    q: 'What are the most important GK questions for competitive exams?',
    a: 'Static GK on Indian history, geography, polity and general science repeats most often in SSC, UPSC, Railway and banking exams. Start with the history, geography and science sets on this page, then practise mixed sets daily.',
  },
  {
    q: 'How many GK questions should I practise every day?',
    a: 'Practising 20 to 30 general knowledge questions with answers every day is enough to build long-term recall. Consistency matters far more than long, occasional study sessions.',
  },
  {
    q: 'Are these GK questions with answers free?',
    a: 'Yes. Every general knowledge question and answer on CuizIN is free to read and free to practise as a timed quiz. You also earn gems for correct answers while you practise.',
  },
  {
    q: 'How do I remember general knowledge answers for longer?',
    a: 'Use active recall instead of re-reading: attempt the question first, check the answer, and revisit the ones you got wrong after a day and again after a week.',
  },
];

const GkQuestionsPage: React.FC = () => {
  const [questionsByCategory, setQuestionsByCategory] = useState<Record<string, GkQuestion[]>>({});
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [{ data, error }, { data: countData }] = await Promise.all([
          (supabase as any).rpc('get_gk_hub_questions', { p_per_category: PER_SECTION }),
          (supabase as any).rpc('get_quiz_question_count'),
        ]);

        if (error) throw error;
        if (cancelled) return;

        const grouped: Record<string, GkQuestion[]> = {};
        ((data || []) as GkQuestion[]).forEach((q) => {
          const section = SECTIONS.find((s) => s.categories.includes(q.category));
          if (!section) return;
          grouped[section.slug] = grouped[section.slug] || [];
          if (grouped[section.slug].length < PER_SECTION) {
            grouped[section.slug].push(q);
          }
        });

        setQuestionsByCategory(grouped);
        setTotalCount(Number(countData) || 0);
      } catch (err) {
        console.error('Error loading GK questions:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    }),
    []
  );

  const availableSections = SECTIONS.filter((s) => (questionsByCategory[s.slug] || []).length > 0);

  return (
    <PageLayout showNewsTicker>
      <SEO
        title="GK Questions with Answers — 1000+ General Knowledge Q&A"
        description="1000+ GK questions with answers for competitive exams: history, geography, science, sports and general awareness. Read answers free, then practise as a timed quiz."
        canonicalUrl="https://cuiz.in/gk-questions"
        schemaType="FAQPage"
        schemaData={faqSchema}
        keywords={[
          'gk questions',
          'gk questions with answers',
          'general knowledge questions',
          'gk questions for competitive exams',
          'general knowledge quiz',
        ]}
      />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>GK Questions with Answers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            1000+ General Knowledge Questions with Answers for Competitive Exams
          </h1>
          <p className="text-muted-foreground text-lg mb-3">
            A free, regularly updated hub of GK questions with answers covering history, geography, science,
            technology, sports and everyday general awareness. Every question below comes from the live CuizIN
            question bank{totalCount > 0 ? ` of ${totalCount.toLocaleString()} questions` : ''}, so you can read the
            answer first and then attempt the same topic as a timed quiz.
          </p>
          <p className="text-muted-foreground">
            Ideal for SSC, UPSC, Railway, banking, state PSC and school-level general knowledge preparation.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button asChild>
              <Link to="/quiz">Practise a free GK quiz</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/browse">Browse the full question bank</Link>
            </Button>
          </div>
        </header>

        <nav aria-label="GK topics on this page" className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Jump to a GK topic</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTIONS.map((s) => (
              <li key={s.slug}>
                <a
                  href={`#${s.slug}`}
                  className="block rounded-md border border-border px-4 py-2 hover:bg-muted transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="my-8">
          <SimpleAdBanner position="content" slotId="gk-questions-top" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Loading general knowledge questions</span>
          </div>
        ) : (
          availableSections.map((section, sectionIndex) => {
            const items = questionsByCategory[section.slug] || [];
            return (
              <div key={section.slug}>
                <section id={section.slug} className="mb-10 scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
                  <p className="text-muted-foreground mb-5">{section.blurb}</p>
                  <ol className="space-y-4">
                    {items.map((q, i) => (
                      <li key={q.id}>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold leading-snug">
                              Q{i + 1}. {q.question}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="font-medium">
                              <span className="text-primary">Answer:</span> {q.correct_answer}
                            </p>
                            {q.explanation && (
                              <p className="text-sm text-muted-foreground mt-2">{q.explanation}</p>
                            )}
                            <Link
                              to={`/quiz/question/${q.id}/${createSlug(q.question)}`}
                              className="text-sm text-primary underline mt-3 inline-block"
                            >
                              Read the full explanation for this question
                            </Link>
                          </CardContent>
                        </Card>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-5">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/categories/${section.slug}`}>
                        More {section.title.replace(' with Answers', '')}
                      </Link>
                    </Button>
                  </div>
                </section>
                {sectionIndex % 2 === 1 && (
                  <div className="my-8">
                    <SimpleAdBanner position="content" slotId={`gk-questions-${section.slug}`} />
                  </div>
                )}
              </div>
            );
          })
        )}

        <section className="mb-10" aria-labelledby="gk-prep-tips">
          <h2 id="gk-prep-tips" className="text-2xl font-bold mb-3">
            How to prepare general knowledge for competitive exams
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Cover static GK first — history, geography, polity and general science rarely change year to year.</li>
            <li>Attempt 20–30 questions daily instead of long weekend sessions; spaced practice builds recall.</li>
            <li>Revisit every question you got wrong after a day, and again after a week.</li>
            <li>Move from reading answers to timed quizzes early — exams test speed as well as recall.</li>
          </ul>
        </section>

        <section className="mb-10" aria-labelledby="gk-faq">
          <h2 id="gk-faq" className="text-2xl font-bold mb-4">
            GK questions — frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <Card key={f.q}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{f.q}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-muted-foreground">{f.a}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Turn GK reading into real practice</h2>
          <p className="text-muted-foreground mb-4">
            Attempt these general knowledge questions as a timed quiz, earn gems for every correct answer and climb
            the monthly leaderboard.
          </p>
          <Button asChild size="lg">
            <Link to="/quiz">Start a free GK quiz</Link>
          </Button>
        </section>
      </div>
    </PageLayout>
  );
};

export default GkQuestionsPage;