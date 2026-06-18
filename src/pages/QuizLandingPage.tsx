import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SEO from '@/components/SEO';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';
import { Trophy, Play, BookOpen, Loader2 } from 'lucide-react';

export interface QuizLandingConfig {
  slug: string;           // e.g. 'cricket-quiz'
  h1: string;             // SEO H1
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  intro: string;          // 1-2 paragraph intro
  whyPlay: string;
  categories: string[];   // DB category names
  questionKeywords: string[]; // ilike search terms
  subTopics: { name: string; description: string }[];
  faqs: { q: string; a: string }[];
  playCtaLink: string;    // where Play button goes
  icon: string;
}

export const landingConfigs: Record<string, QuizLandingConfig> = {
  'cricket-quiz': {
    slug: 'cricket-quiz',
    h1: 'Cricket Quiz — Test Your Cricket Knowledge',
    metaTitle: 'Cricket Quiz: 95+ Questions on IPL, World Cup & Legends | CuizIN',
    metaDescription: 'Play the ultimate cricket quiz online. Test your knowledge of IPL, ICC World Cup, Sachin, Kohli, Dhoni, records, and cricket history. Free, instant scoring.',
    keywords: ['cricket quiz', 'ipl quiz', 'cricket trivia', 'cricket world cup quiz', 'cricket questions', 'cricket gk', 'sachin tendulkar quiz'],
    intro: 'Cricket is more than a sport in India — it is a way of life. Our cricket quiz brings together questions on every era of the game, from the 1983 World Cup triumph to the modern IPL era. Whether you follow Test cricket, ODIs, T20s or the Women\'s Premier League, there is something here to challenge every fan.',
    whyPlay: 'Built specifically for Indian cricket fans, this quiz blends international cricket history with deep coverage of the IPL, domestic Ranji Trophy, and Indian legends like Sachin Tendulkar, MS Dhoni, Virat Kohli, and Rohit Sharma. Earn gems with every correct answer and climb the CuizIN leaderboard.',
    categories: ['Cricket', 'Sports'],
    questionKeywords: ['cricket', 'ipl', 'world cup', 'sachin', 'kohli', 'dhoni', 'wicket', 'century', 'odi', 't20'],
    subTopics: [
      { name: 'IPL & T20 Cricket', description: 'Auctions, MVPs, franchise history, and unforgettable IPL finals.' },
      { name: 'ICC World Cup', description: 'Every Cricket World Cup from 1975 to 2023 — winners, records, key moments.' },
      { name: 'Indian Cricket Legends', description: 'Sachin, Kapil Dev, Dhoni, Kohli, Rohit Sharma and the players who shaped Indian cricket.' },
      { name: 'Test Cricket & The Ashes', description: 'Classic Test matches, batting milestones, and bowling records.' },
      { name: 'Cricket Rules & Stats', description: 'DRS, LBW, Duckworth-Lewis, batting averages and statistical trivia.' },
    ],
    faqs: [
      { q: 'How many cricket quiz questions are there?', a: 'CuizIN has more than 95 cricket-specific questions plus hundreds of broader sports questions, all with detailed explanations.' },
      { q: 'Does the cricket quiz cover IPL?', a: 'Yes. Questions span every IPL season, including auctions, franchise records, and player of the tournament awards.' },
      { q: 'Is the cricket quiz free?', a: 'Completely free. Sign up to save your score, earn gems and appear on the monthly leaderboard.' },
      { q: 'How are questions scored?', a: 'Each correct answer earns gems instantly. Difficulty determines the gems value — harder questions are worth more.' },
    ],
    playCtaLink: '/topics/cricket',
    icon: '🏏',
  },
  'bollywood-quiz': {
    slug: 'bollywood-quiz',
    h1: 'Bollywood Quiz — Hindi Cinema, Songs & Stars',
    metaTitle: 'Bollywood Quiz: Movies, Songs, Actors & Dialogues | CuizIN',
    metaDescription: 'The biggest Bollywood quiz online. Questions on iconic movies, blockbuster songs, legendary actors, and unforgettable dialogues from Hindi cinema. Play free now.',
    keywords: ['bollywood quiz', 'hindi movie quiz', 'bollywood trivia', 'bollywood songs quiz', 'bollywood actor quiz', 'shah rukh khan quiz', 'bollywood dialogues quiz'],
    intro: 'From the Golden Age of Raj Kapoor and Dilip Kumar to today\'s pan-India blockbusters, Bollywood has soundtracked Indian life for over a century. Our Bollywood quiz spans every era — classic black-and-white cinema, the disco-driven 80s, the family dramas of the 90s, and the global hits of the modern Khans.',
    whyPlay: 'Whether you can hum every Lata Mangeshkar number or quote Sholay line by line, this quiz puts your Hindi cinema knowledge to the test. Questions cover movies, music, dialogues, directors, awards and the actors who became cultural icons.',
    categories: ['Entertainment: Film', 'Entertainment: Music', 'Entertainment', 'Celebrities'],
    questionKeywords: ['bollywood', 'hindi film', 'shah rukh', 'amitabh', 'salman', 'aamir', 'lata', 'kishore', 'rahman'],
    subTopics: [
      { name: 'Classic Bollywood', description: 'Mughal-e-Azam, Sholay, Mother India and the films that built Hindi cinema.' },
      { name: 'Bollywood Songs', description: 'Lata Mangeshkar, Kishore Kumar, A.R. Rahman — the music that defines generations.' },
      { name: 'The Khans & Modern Stars', description: 'Shah Rukh, Salman, Aamir, Ranveer, Alia and today\'s biggest names.' },
      { name: 'Iconic Dialogues', description: '"Kitne aadmi the?" — test your memory of Bollywood\'s most quoted lines.' },
      { name: 'Awards & Box Office', description: 'Filmfare, National Awards, and the all-time highest grossers.' },
    ],
    faqs: [
      { q: 'What does the Bollywood quiz cover?', a: 'Movies, music, actors, directors, dialogues, awards and box-office trivia from every era of Hindi cinema.' },
      { q: 'Are there questions on old Bollywood?', a: 'Yes — from the 1940s classics to modern OTT releases, every era is represented.' },
      { q: 'Is the Bollywood quiz free?', a: 'Yes, 100% free. Create a free account to track your score and earn gems.' },
      { q: 'How often are new questions added?', a: 'New Bollywood questions are added every week, covering recent releases and trending stars.' },
    ],
    playCtaLink: '/topics/bollywood',
    icon: '🎬',
  },
  'gk-quiz': {
    slug: 'gk-quiz',
    h1: 'GK Quiz — General Knowledge Questions',
    metaTitle: 'GK Quiz: 200+ General Knowledge Questions (India & World) | CuizIN',
    metaDescription: 'Play India\'s favourite GK quiz online. 200+ general knowledge questions covering current affairs, history, geography, science and India GK. Free with instant scoring.',
    keywords: ['gk quiz', 'general knowledge quiz', 'gk questions', 'india gk quiz', 'gk in english', 'general knowledge questions and answers', 'daily gk quiz'],
    intro: 'A strong general knowledge base is the foundation of every competitive exam — UPSC, SSC, banking, railways and school olympiads. Our GK quiz is built for Indian learners and curious minds, with questions covering current affairs, Indian history, geography, world events, science, and culture.',
    whyPlay: 'Practice daily with bite-sized GK quizzes that mirror the format of real competitive exam questions. Each question comes with an explanation so you learn while you play. Save your progress, track your rank, and challenge friends.',
    categories: ['General Knowledge', 'Mythology', 'Culture', 'Politics', 'History', 'Geography'],
    questionKeywords: ['india', 'capital', 'first', 'largest', 'longest', 'highest', 'president', 'prime minister', 'invented', 'discovered'],
    subTopics: [
      { name: 'India GK', description: 'States, capitals, monuments, Indian Constitution, freedom fighters and Indian polity.' },
      { name: 'Current Affairs', description: 'Recent events, awards, appointments, sports news and global headlines.' },
      { name: 'World History', description: 'Ancient civilizations, world wars, revolutions and turning gems in human history.' },
      { name: 'Geography', description: 'Countries, capitals, rivers, mountains, deserts and physical geography.' },
      { name: 'Science & Tech', description: 'Inventions, discoveries, space, biology, physics and chemistry basics.' },
      { name: 'Sports & Culture', description: 'Olympics, World Cups, art, literature and cultural heritage.' },
    ],
    faqs: [
      { q: 'How many GK questions are on CuizIN?', a: 'Over 200 General Knowledge questions plus 500+ across history, geography, science and politics — all useful for GK practice.' },
      { q: 'Is this GK quiz good for competitive exams?', a: 'Yes. Question patterns reflect SSC, banking and state-level exam formats, with explanations to deepen understanding.' },
      { q: 'Can I play the GK quiz daily?', a: 'Yes — a fresh set of questions is available every day, and daily play earns bonus gems.' },
      { q: 'Does the quiz include India-specific GK?', a: 'Strongly yes. Indian history, polity, geography and culture form a large share of every quiz.' },
    ],
    playCtaLink: '/categories/general-knowledge',
    icon: '🧠',
  },
};

interface SampleQuestion {
  id: string;
  question: string;
  category: string;
}

const QuizLandingPage: React.FC<{ slug: keyof typeof landingConfigs }> = ({ slug }) => {
  const config = landingConfigs[slug];
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<SampleQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const orClause = [
          `category.in.(${config.categories.map(c => `"${c}"`).join(',')})`,
          ...config.questionKeywords.map(k => `question.ilike.%${k}%`),
        ].join(',');
        const { data } = await supabase
          .from('quiz_questions')
          .select('id, question, category')
          .or(orClause)
          .limit(20);
        if (!cancelled) setQuestions(data || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const canonical = `https://cuiz.in/${config.slug}`;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cuiz.in/' },
      { '@type': 'ListItem', position: 2, name: config.h1, item: canonical },
    ],
  };

  return (
    <PageLayout>
      <SEO
        title={config.metaTitle}
        description={config.metaDescription}
        canonicalUrl={canonical}
        keywords={config.keywords}
        ogType="website"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <main className="container max-w-5xl px-4 py-10">
        {/* Hero */}
        <section className="text-center mb-10">
          <div className="text-6xl mb-4" aria-hidden>{config.icon}</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{config.h1}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
            {config.intro}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate(config.playCtaLink)}>
              <Play className="w-4 h-4 mr-2" /> Play Now
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/categories"><BookOpen className="w-4 h-4 mr-2" /> All Categories</Link>
            </Button>
          </div>
        </section>

        {/* Why play */}
        <section className="mb-10">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-3">Why play this quiz?</h2>
              <p className="text-muted-foreground">{config.whyPlay}</p>
            </CardContent>
          </Card>
        </section>

        {/* Sub-topics */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">What's inside</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {config.subTopics.map((t) => (
              <Card key={t.name}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Sample questions */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Sample questions
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : questions.length === 0 ? (
            <p className="text-muted-foreground">More questions coming soon.</p>
          ) : (
            <ul className="space-y-2">
              {questions.slice(0, 12).map((q) => (
                <li key={q.id}>
                  <Link
                    to={`/quiz/question/${q.id}/${getCategorySlug(q.category)}/${createSlug(q.question)}`}
                    className="block p-3 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                  >
                    {q.question}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 text-center">
            <Button size="lg" onClick={() => navigate(config.playCtaLink)}>
              Start the {config.h1.split('—')[0].trim()}
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {config.faqs.map((f) => (
              <Card key={f.q}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{f.q}</h3>
                  <p className="text-sm text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Related */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">More quizzes</h2>
          <div className="flex gap-3 flex-wrap">
            {Object.values(landingConfigs)
              .filter(c => c.slug !== config.slug)
              .map(c => (
                <Link
                  key={c.slug}
                  to={`/${c.slug}`}
                  className="px-4 py-2 rounded-full border border-border hover:bg-muted text-sm"
                >
                  {c.icon} {c.h1.split('—')[0].trim()}
                </Link>
              ))}
          </div>
        </section>
      </main>
    </PageLayout>
  );
};

export default QuizLandingPage;
