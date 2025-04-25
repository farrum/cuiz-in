import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Search, Filter, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

// Sample quiz categories data
const categoryData = {
  'history': {
    name: 'History',
    description: 'Test your knowledge of world history, important events, and historical figures.',
    longDescription: 'Dive into the fascinating world of history with our comprehensive quiz collection. From ancient civilizations to modern events, our history quizzes cover a wide range of topics that will challenge your knowledge about the past. Learn about important historical figures, pivotal moments, and the evolution of human society through engaging questions.',
    questionCount: 153,
    icon: '📜',
    difficultyDistribution: {
      easy: 40,
      medium: 35,
      hard: 25
    },
    subcategories: [
      'Ancient History', 'Medieval Period', 'World Wars', 'American History', 'Asian History', 'European History'
    ],
    featuredQuestions: [
      {
        id: 'hist-001',
        question: 'In which year did Christopher Columbus first reach the Americas?',
        difficulty: 'medium'
      },
      {
        id: 'hist-002',
        question: 'Who was the first Emperor of Rome?',
        difficulty: 'medium'
      },
      {
        id: 'hist-003',
        question: 'Which civilization built the ancient city of Machu Picchu?',
        difficulty: 'hard'
      },
      {
        id: 'hist-004',
        question: 'During which century did the Black Death primarily spread across Europe?',
        difficulty: 'medium'
      }
    ],
    topPerformers: [
      { username: 'HistoryBuff42', points: 1250, rank: 1 },
      { username: 'TimeTraveler', points: 1150, rank: 2 },
      { username: 'AncientScholar', points: 1050, rank: 3 }
    ]
  },
  'science': {
    name: 'Science',
    description: 'Challenge yourself with questions about physics, chemistry, biology, and scientific discoveries.',
    longDescription: 'Explore the wonders of science through our diverse collection of quizzes. From the fundamental laws of physics to cutting-edge discoveries in genetics, our science category offers a stimulating challenge for both science enthusiasts and curious minds. Test your knowledge about the natural world, scientific principles, and the brilliant minds who shaped our understanding of the universe.',
    questionCount: 178,
    icon: '🔬',
    difficultyDistribution: {
      easy: 35,
      medium: 40,
      hard: 25
    },
    subcategories: [
      'Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth Science', 'Scientific Discoveries'
    ],
    featuredQuestions: [
      {
        id: 'sci-001',
        question: 'What is the chemical symbol for gold?',
        difficulty: 'easy'
      },
      {
        id: 'sci-002',
        question: 'Which planet in our solar system has the most moons?',
        difficulty: 'medium'
      },
      {
        id: 'sci-003',
        question: 'What is the smallest unit of life that can replicate independently?',
        difficulty: 'medium'
      },
      {
        id: 'sci-004',
        question: 'What particle has the same mass as an electron but positive charge?',
        difficulty: 'hard'
      }
    ],
    topPerformers: [
      { username: 'QuantumThinker', points: 1350, rank: 1 },
      { username: 'MolecularMaster', points: 1200, rank: 2 },
      { username: 'StarGazer', points: 1100, rank: 3 }
    ]
  }
  // More categories would be defined here in a real implementation
};

const CategoryDetailPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Get category data by slug
  const category = categorySlug ? categoryData[categorySlug as keyof typeof categoryData] : null;
  
  // If category not found, redirect to categories page
  if (!category) {
    return <Navigate to="/categories" replace />;
  }
  
  // Generate schema.org structured data for this category
  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${category.name} Quizzes`,
    'description': category.description,
    'numberOfItems': category.questionCount,
    'itemListElement': category.featuredQuestions.map((question, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Question',
        'name': question.question
      }
    }))
  };

  // Difficulty badge color mapping
  const difficultyColor = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${category.name} Quizzes | CuizIN`}
        description={category.description}
        canonicalUrl={`https://cuiz.in/categories/${categorySlug}`}
        schemaType="WebPage"
        schemaData={categorySchema}
      />
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-6xl pt-12 pb-16 px-4">
        <Link to="/categories" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Categories
        </Link>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl">{category.icon}</div>
          <div>
            <h1 className="text-3xl font-bold">{category.name} Quizzes</h1>
            <p className="text-muted-foreground">{category.questionCount} questions available</p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">About This Category</h2>
          <p className="text-muted-foreground mb-6">{category.longDescription}</p>
          
          <h3 className="text-lg font-medium mb-3">Difficulty Levels</h3>
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between mb-1">
              <span>Easy</span>
              <span>{category.difficultyDistribution.easy}%</span>
            </div>
            <Progress value={category.difficultyDistribution.easy} className="h-2 bg-green-100" />
            
            <div className="flex items-center justify-between mb-1">
              <span>Medium</span>
              <span>{category.difficultyDistribution.medium}%</span>
            </div>
            <Progress value={category.difficultyDistribution.medium} className="h-2 bg-blue-100" />
            
            <div className="flex items-center justify-between mb-1">
              <span>Hard</span>
              <span>{category.difficultyDistribution.hard}%</span>
            </div>
            <Progress value={category.difficultyDistribution.hard} className="h-2 bg-red-100" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button>
              Start {category.name} Quiz
            </Button>
            <Button variant="outline">
              View All Questions
            </Button>
          </div>
        </div>
        
        <SimpleAdBanner position="content" />
        
        <div className="grid gap-8 md:grid-cols-3 mt-8">
          <div className="md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-semibold">Featured Questions</h2>
              
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="easy">Easy</TabsTrigger>
                <TabsTrigger value="medium">Medium</TabsTrigger>
                <TabsTrigger value="hard">Hard</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-4">
              {category.featuredQuestions
                .filter(q => activeTab === 'all' || q.difficulty === activeTab)
                .filter(q => q.question.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(question => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{question.question}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${difficultyColor[question.difficulty as 'easy' | 'medium' | 'hard']}`}>
                          {question.difficulty}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Link 
                          to={`/quiz/question/${question.id}/${encodeURIComponent(question.question.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50))}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Answer this question
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
              {category.featuredQuestions
                .filter(q => activeTab === 'all' || q.difficulty === activeTab)
                .filter(q => q.question.toLowerCase().includes(searchTerm.toLowerCase()))
                .length === 0 && (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">No questions found matching your filters.</p>
                </div>
              )}
            </div>
            
            {category.featuredQuestions.length > 4 && (
              <div className="mt-6 text-center">
                <Button variant="outline">
                  Load More Questions
                </Button>
              </div>
            )}
          </div>
          
          <div>
            <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                Top Performers
              </h2>
              
              <div className="space-y-4">
                {category.topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {performer.rank}
                      </div>
                      <span>{performer.username}</span>
                    </div>
                    <span className="font-medium">{performer.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
              <div className="grid grid-cols-2 gap-2">
                {category.subcategories.map((subcat, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="justify-start h-auto py-2 px-3 text-sm"
                  >
                    {subcat}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CategoryDetailPage;
