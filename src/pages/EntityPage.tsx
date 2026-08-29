import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  MapPin, 
  Calendar, 
  Lightbulb, 
  ExternalLink, 
  CheckCircle2, 
  BrainCircuit, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck,
  Layers,
  Sparkles,
  HelpCircle,
  PlayCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ENTITY_REGISTRY, EntityMetadata, EntityType, getEntityBySlug } from '@/utils/entityData';
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';
import { getQuestionSubcategorySlug } from '@/utils/subcategoryConfig';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

interface EntityPageProps {
  entityType?: EntityType;
}

const typeIconMap = {
  person: User,
  place: MapPin,
  event: Calendar,
  concept: Lightbulb
};

const typeLabelMap: Record<EntityType, { title: string; prefix: string; singular: string }> = {
  person: { title: 'People & Historical Figures', prefix: '/people', singular: 'Person' },
  place: { title: 'Places & World Landmarks', prefix: '/places', singular: 'Place' },
  event: { title: 'Historic Events & Eras', prefix: '/events', singular: 'Event' },
  concept: { title: 'Concepts & Scientific Theories', prefix: '/concepts', singular: 'Concept' }
};

export const EntityPage: React.FC<EntityPageProps> = ({ entityType }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<EntityMetadata | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const found = getEntityBySlug(slug);
    if (found) {
      setEntity(found);
    } else {
      setEntity(null);
    }
  }, [slug]);

  useEffect(() => {
    const fetchEntityQuestions = async () => {
      if (!entity) return;
      setLoadingQuestions(true);
      try {
        // Fetch questions from Supabase matching category or keywords
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('id, question, category, difficulty, correct_answer, options, points, explanation')
          .limit(400);

        if (!error && data) {
          const matched = data.filter(q => {
            const lowerQ = q.question.toLowerCase();
            const lowerExpl = (q.explanation || '').toLowerCase();
            return entity.keywords.some(kw => lowerQ.includes(kw) || lowerExpl.includes(kw));
          });
          setQuestions(matched.slice(0, 30));
        }
      } catch (err) {
        console.error('Error fetching questions for entity:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchEntityQuestions();
  }, [entity]);

  if (!entity) {
    return (
      <PageLayout>
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Knowledge Entity Not Found</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The topic or entity you are looking for has not yet been indexed in our knowledge graph. Explore our directory of people, places, and historical events.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button asChild>
              <Link to="/entities">Browse Knowledge Graph</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/all-questions">All Questions Directory</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const effectiveType = entity.type || entityType || 'person';
  const typeConfig = typeLabelMap[effectiveType];
  const IconComponent = typeIconMap[effectiveType] || User;
  const canonicalUrl = `https://cuiz.in${typeConfig.prefix}/${entity.slug}`;

  // Breadcrumbs
  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Knowledge Graph', '/entities'),
    createBreadcrumbs.custom(typeConfig.title, typeConfig.prefix),
    createBreadcrumbs.custom(entity.name, `${typeConfig.prefix}/${entity.slug}`)
  ];

  // Schema.org Entity mapping
  const entitySchemaType = 
    effectiveType === 'person' ? 'Person' :
    effectiveType === 'place' ? 'Place' :
    effectiveType === 'event' ? 'Event' : 'DefinedTerm';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': entitySchemaType,
    '@id': `${canonicalUrl}#entity`,
    'name': entity.name,
    'description': entity.summary,
    'url': canonicalUrl,
    'sameAs': entity.sameAs,
    'subjectOf': questions.map(q => {
      const qSlug = createSlug(q.question);
      const catSlug = getCategorySlug(q.category);
      return {
        '@type': 'Question',
        'name': q.question,
        'url': `https://cuiz.in/quiz/question/${q.id}/${catSlug}/${qSlug}`
      };
    })
  };

  // Related entities in registry
  const relatedEntities = ENTITY_REGISTRY.filter(e => 
    entity.relatedEntitySlugs.includes(e.slug) || 
    (e.category === entity.category && e.slug !== entity.slug)
  ).slice(0, 4);

  return (
    <PageLayout>
      <SEO
        title={`${entity.name} — Facts, Timeline & Quiz Questions | CuizIN Knowledge Graph`}
        description={`Explore comprehensive facts, key chronology, authoritative sources, and ${questions.length}+ verified trivia questions about ${entity.name} on CuizIN.`}
        canonicalUrl={canonicalUrl}
        schemaType={entitySchemaType as any}
        schemaData={schemaData}
        keywords={[entity.name, ...entity.keywords, entity.category, 'quiz questions', 'trivia', 'facts']}
      />
      <BreadcrumbSchema items={breadcrumbs} />

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Navigation Breadcrumb Bar */}
        <nav className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>&rsaquo;</span>
          <Link to="/entities" className="hover:text-foreground">Knowledge Graph</Link>
          <span>&rsaquo;</span>
          <Link to={typeConfig.prefix} className="hover:text-foreground">{typeConfig.title}</Link>
          <span>&rsaquo;</span>
          <span className="text-foreground font-medium">{entity.name}</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-card text-card-foreground rounded-2xl border p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 text-xs py-1 px-2.5">
                <IconComponent className="w-3.5 h-3.5" />
                {typeConfig.singular}
              </Badge>
              <Badge variant="outline" className="text-xs py-1 px-2.5">
                {entity.category}
              </Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 flex items-center gap-1 text-xs py-1 px-2.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Fact-Verified Entity
              </Badge>
            </div>

            {entity.eraOrPeriod && (
              <span className="text-xs text-muted-foreground font-medium">
                {entity.eraOrPeriod}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {entity.name}
            </h1>
            {entity.roleOrDesignation && (
              <p className="text-base sm:text-lg text-primary font-medium">
                {entity.roleOrDesignation}
              </p>
            )}
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {entity.summary}
          </p>
        </div>

        {/* Key Chronology & Quick Facts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Quick Facts Card */}
            <Card className="bg-card text-card-foreground shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Key Facts &amp; Historical Chronology
                </CardTitle>
                <CardDescription>
                  Verified reference data and core milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {entity.keyFacts.map((fact, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border/60">
                      <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{fact.label}</dt>
                      <dd className="font-semibold text-foreground mt-0.5">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            {/* Questions Bank for this Entity */}
            <Card className="bg-card text-card-foreground shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-primary" />
                      Trivia Questions &amp; Knowledge Tests ({questions.length})
                    </CardTitle>
                    <CardDescription>
                      Test your understanding of {entity.name} with fact-checked questions from the CuizIN repository.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingQuestions ? (
                  <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                    Loading knowledge questions...
                  </div>
                ) : questions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-muted/30 rounded-lg">
                    No specific questions isolated for this entity query yet. Explore our main category hub for related challenges.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {questions.map(q => {
                      const catSlug = getCategorySlug(q.category);
                      const subSlug = getQuestionSubcategorySlug(q.category, q.question);
                      const qSlug = createSlug(q.question, 50);
                      const targetUrl = subSlug
                        ? `/quiz/question/${q.id}/${catSlug}/${subSlug}/${qSlug}`
                        : `/quiz/question/${q.id}/${catSlug}/${qSlug}`;
                      const ans = q.correct_answer || (Array.isArray(q.options) ? q.options[0] : '');

                      return (
                        <div 
                          key={q.id}
                          className="p-3.5 bg-muted/40 hover:bg-muted/70 rounded-lg border border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1 max-w-xl">
                            <Link 
                              to={targetUrl}
                              className="font-medium text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2"
                            >
                              {q.question}
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                Ans: {ans}
                              </span>
                              <span>&bull;</span>
                              <span className="capitalize">{q.difficulty || 'medium'}</span>
                            </div>
                          </div>

                          <Button size="sm" variant="outline" asChild className="h-7 text-xs shrink-0">
                            <Link to={targetUrl}>
                              Play &amp; Learn <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Authoritative Provenance & Related Entities */}
          <aside className="space-y-6">
            {/* SameAs Knowledge Sources */}
            <Card className="bg-card text-card-foreground shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Authoritative References
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {entity.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-foreground transition-colors border border-border"
                  >
                    <span className="truncate max-w-[200px]">{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </a>
                ))}

                <div className="pt-2 border-t border-border space-y-1.5">
                  <div className="text-[11px] text-muted-foreground font-semibold uppercase">Knowledge Graph Identifiers:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {entity.sameAs.map((url, idx) => {
                      const domain = url.includes('wikipedia') ? 'Wikipedia' : url.includes('wikidata') ? 'Wikidata' : url.includes('britannica') ? 'Britannica' : 'Gov Portal';
                      return (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground border"
                        >
                          {domain} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Knowledge Graph Entities */}
            {relatedEntities.length > 0 && (
              <Card className="bg-card text-card-foreground shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Related Entities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {relatedEntities.map(rel => {
                    const relTypeConfig = typeLabelMap[rel.type];
                    return (
                      <Link
                        key={rel.slug}
                        to={`${relTypeConfig.prefix}/${rel.slug}`}
                        className="p-2.5 rounded-lg bg-muted/40 hover:bg-muted/80 border border-border block space-y-1 transition-colors"
                      >
                        <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>{rel.name}</span>
                          <span className="text-[10px] text-muted-foreground capitalize font-normal">{rel.type}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {rel.roleOrDesignation || rel.summary}
                        </p>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Ad Banner */}
            <SimpleAdBanner position="sidebar" slotId="entity-sidebar" />
          </aside>
        </div>
      </main>
    </PageLayout>
  );
};

export default EntityPage;
