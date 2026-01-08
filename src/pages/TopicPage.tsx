import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import PageLayout from '@/components/layout/PageLayout';
import NewsTicker from '@/components/NewsTicker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/urlUtils';
import { Loader2, ArrowLeft, Trophy, BookOpen } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: string | null;
}

// Topic configuration with keywords for database search
const topicConfig: Record<string, {
  title: string;
  description: string;
  keywords: string[];
  categories: string[];
  icon: string;
}> = {
  'indian-history': {
    title: 'Indian History',
    description: 'Test your knowledge of Indian history from ancient civilizations to modern India. Questions cover the Mughal Empire, British Raj, Independence movement, and more.',
    keywords: ['india', 'indian', 'mughal', 'british', 'gandhi', 'nehru', 'delhi', 'empire', 'independence', 'partition'],
    categories: ['History'],
    icon: '🇮🇳'
  },
  'bollywood': {
    title: 'Bollywood Movies & Music',
    description: 'How well do you know Bollywood? Answer questions about iconic movies, legendary actors, famous songs, and memorable dialogues from Hindi cinema.',
    keywords: ['bollywood', 'hindi', 'movie', 'film', 'actor', 'actress', 'song', 'music', 'india'],
    categories: ['Entertainment', 'Entertainment: Film', 'Entertainment: Music', 'Celebrities'],
    icon: '🎬'
  },
  'cricket': {
    title: 'Cricket Trivia',
    description: 'For cricket lovers! Test your knowledge about cricket legends, World Cups, IPL, famous matches, records, and cricketing history.',
    keywords: ['cricket', 'ipl', 'world cup', 'sachin', 'kohli', 'dhoni', 'test', 'odi', 't20', 'wicket', 'century'],
    categories: ['Cricket', 'Sports'],
    icon: '🏏'
  },
  'world-geography': {
    title: 'World Geography',
    description: 'Explore the world through geography questions. Learn about countries, capitals, landmarks, rivers, mountains, and natural wonders.',
    keywords: ['country', 'capital', 'river', 'mountain', 'ocean', 'continent', 'border', 'island', 'desert'],
    categories: ['Geography'],
    icon: '🌍'
  },
  'science-technology': {
    title: 'Science & Technology',
    description: 'Questions about scientific discoveries, inventions, technology, space exploration, physics, chemistry, and biology.',
    keywords: ['science', 'technology', 'invention', 'discovery', 'space', 'computer', 'physics', 'chemistry', 'biology'],
    categories: ['Science', 'Science & Nature', 'Science: Computers', 'Science and Technology'],
    icon: '🔬'
  },
  'world-history': {
    title: 'World History',
    description: 'Journey through world history with questions about ancient civilizations, wars, revolutions, empires, and historical figures.',
    keywords: ['war', 'revolution', 'empire', 'king', 'queen', 'president', 'battle', 'treaty', 'civilization'],
    categories: ['History'],
    icon: '📜'
  },
  'mythology': {
    title: 'Mythology & Legends',
    description: 'Dive into mythologies from around the world. Greek gods, Hindu epics, Norse legends, and ancient stories await.',
    keywords: ['god', 'goddess', 'myth', 'legend', 'zeus', 'vishnu', 'thor', 'epic', 'hero'],
    categories: ['Mythology'],
    icon: '⚡'
  },
  'video-games': {
    title: 'Video Games',
    description: 'For gamers! Questions about popular video games, gaming history, characters, developers, and gaming culture.',
    keywords: ['game', 'gaming', 'nintendo', 'playstation', 'xbox', 'pc', 'character', 'level', 'player'],
    categories: ['Entertainment: Video Games'],
    icon: '🎮'
  },
  'movies-tv': {
    title: 'Movies & TV Shows',
    description: 'Hollywood, TV series, Oscar winners, famous directors, and iconic movie moments. Test your entertainment knowledge!',
    keywords: ['movie', 'film', 'actor', 'director', 'oscar', 'tv', 'series', 'hollywood', 'netflix'],
    categories: ['Entertainment: Film', 'Entertainment: Television', 'Entertainment'],
    icon: '🎥'
  },
  'food-cuisine': {
    title: 'Food & Cuisine',
    description: 'Questions about world cuisines, famous dishes, cooking techniques, ingredients, and food history.',
    keywords: ['food', 'cuisine', 'dish', 'recipe', 'cooking', 'chef', 'restaurant', 'ingredient'],
    categories: ['Food & Drink', 'Food and Drinks'],
    icon: '🍽️'
  }
};

// List of all topics for the topics index page
export const allTopics = Object.entries(topicConfig).map(([slug, config]) => ({
  slug,
  ...config
}));

const TopicPage: React.FC = () => {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const topic = topicSlug ? topicConfig[topicSlug] : null;

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!topic || !topicSlug) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // First fetch by categories
        let { data: categoryQuestions } = await supabase
          .from('quiz_questions')
          .select('id, question, category, difficulty')
          .in('category', topic.categories)
          .limit(30);

        // Then search by keywords in questions
        const keywordQueries = topic.keywords.map(keyword =>
          supabase
            .from('quiz_questions')
            .select('id, question, category, difficulty')
            .ilike('question', `%${keyword}%`)
            .limit(10)
        );

        const keywordResults = await Promise.all(keywordQueries);
        const keywordQuestions = keywordResults.flatMap(r => r.data || []);

        // Combine and deduplicate
        const allQuestions = [...(categoryQuestions || []), ...keywordQuestions];
        const uniqueQuestions = Array.from(
          new Map(allQuestions.map(q => [q.id, q])).values()
        ).slice(0, 50);

        setQuestions(uniqueQuestions);
      } catch (error) {
        console.error('Error fetching topic questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [topicSlug, topic]);

  // Topic not found
  if (!topic) {
    return (
      <PageLayout>
        <SEO
          title="Topics | CuizIN"
          description="Browse quiz topics and test your knowledge on various subjects."
          canonicalUrl="https://cuiz.in/topics"
        />
        <NewsTicker className="mt-16" />
        <main className="flex-1 container max-w-6xl pt-12 pb-16 px-4">
          <h1 className="text-4xl font-bold mb-4 text-center">Quiz Topics</h1>
          <p className="text-muted-foreground text-center mb-8">
            Explore specialized quiz topics and test your knowledge
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allTopics.map(t => (
              <Card key={t.slug} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-4xl mb-3">{t.icon}</div>
                  <h2 className="text-xl font-semibold mb-2">{t.title}</h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {t.description}
                  </p>
                  <Button asChild className="w-full">
                    <Link to={`/topics/${t.slug}`}>Explore Topic</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </PageLayout>
    );
  }

  const breadcrumbs = [
    createBreadcrumbs.home(),
    { name: 'Topics', url: 'https://cuiz.in/topics' },
    { name: topic.title, url: `https://cuiz.in/topics/${topicSlug}` }
  ];

  // Schema for topic page
  const topicSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': `${topic.title} Quiz Questions`,
    'description': topic.description,
    'url': `https://cuiz.in/topics/${topicSlug}`,
    'numberOfItems': questions.length,
    'about': {
      '@type': 'Thing',
      'name': topic.title
    },
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': questions.length,
      'itemListElement': questions.slice(0, 10).map((q, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'url': `https://cuiz.in/quiz/question/${q.id}/${createSlug(q.question)}`
      }))
    }
  };

  return (
    <PageLayout>
      <SEO
        title={`${topic.title} Quiz | Test Your Knowledge | CuizIN`}
        description={topic.description}
        canonicalUrl={`https://cuiz.in/topics/${topicSlug}`}
        schemaType="WebPage"
        schemaData={topicSchema}
        keywords={topic.keywords}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <NewsTicker className="mt-16" />

      <main className="flex-1 container max-w-6xl pt-12 pb-16 px-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/topics">Topics</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{topic.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Top Ad */}
        <div className="mb-8">
          <SimpleAdBanner position="header" />
        </div>

        {/* Topic Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{topic.icon}</div>
          <h1 className="text-4xl font-bold mb-4">{topic.title} Quiz</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {topic.description}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{questions.length * 10}</div>
              <div className="text-sm text-muted-foreground">Points Available</div>
            </CardContent>
          </Card>
        </div>

        {/* Start Quiz Button */}
        <div className="text-center mb-8">
          <Button size="lg" asChild>
            <Link to="/quiz">Start Quiz Now</Link>
          </Button>
        </div>

        {/* Questions List */}
        <h2 className="text-2xl font-semibold mb-4">Featured Questions</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No questions found for this topic yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium text-muted-foreground min-w-[30px]">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <Link
                        to={`/quiz/question/${question.id}/${createSlug(question.question)}`}
                        className="text-foreground hover:text-primary transition-colors font-medium"
                      >
                        {question.question}
                      </Link>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {question.category}
                        </span>
                        {question.difficulty && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {question.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Related Topics */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Explore More Topics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allTopics
              .filter(t => t.slug !== topicSlug)
              .slice(0, 6)
              .map(t => (
                <Card key={t.slug} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <Link to={`/topics/${t.slug}`} className="flex items-center gap-3">
                      <span className="text-2xl">{t.icon}</span>
                      <span className="font-medium hover:text-primary transition-colors">
                        {t.title}
                      </span>
                    </Link>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Bottom Ad */}
        <div className="mt-12">
          <SimpleAdBanner position="footer" />
        </div>
      </main>
    </PageLayout>
  );
};

export default TopicPage;
