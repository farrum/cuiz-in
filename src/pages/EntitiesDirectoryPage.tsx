import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  MapPin, 
  Calendar, 
  Lightbulb, 
  Search, 
  BrainCircuit, 
  ArrowRight, 
  Sparkles, 
  Layers,
  ShieldCheck
} from 'lucide-react';
import { ENTITY_REGISTRY, EntityMetadata, EntityType } from '@/utils/entityData';

interface EntitiesDirectoryProps {
  initialType?: EntityType | 'all';
}

const typeIconMap = {
  person: User,
  place: MapPin,
  event: Calendar,
  concept: Lightbulb
};

export const EntitiesDirectoryPage: React.FC<EntitiesDirectoryProps> = ({ initialType = 'all' }) => {
  const [selectedType, setSelectedType] = useState<EntityType | 'all'>(initialType);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntities = ENTITY_REGISTRY.filter(entity => {
    if (selectedType !== 'all' && entity.type !== selectedType) return false;
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      return (
        entity.name.toLowerCase().includes(lower) ||
        entity.category.toLowerCase().includes(lower) ||
        entity.summary.toLowerCase().includes(lower) ||
        (entity.roleOrDesignation && entity.roleOrDesignation.toLowerCase().includes(lower)) ||
        entity.keywords.some(kw => kw.includes(lower))
      );
    }
    return true;
  });

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Knowledge Graph Entities', '/entities')
  ];

  const typeConfigMap: Record<EntityType, { prefix: string; label: string }> = {
    person: { prefix: '/people', label: 'People' },
    place: { prefix: '/places', label: 'Places' },
    event: { prefix: '/events', label: 'Events' },
    concept: { prefix: '/concepts', label: 'Concepts' }
  };

  return (
    <PageLayout>
      <SEO
        title="Knowledge Graph & Entity Directory — People, Places, Events & Concepts | CuizIN"
        description="Explore CuizIN's structured Knowledge Graph: comprehensive directory of historical figures, world landmarks, pivotal historic events, and scientific concepts with verified facts and trivia questions."
        canonicalUrl="https://cuiz.in/entities"
        keywords={['knowledge graph', 'historical figures', 'world geography', 'historic events', 'science concepts', 'trivia entities', 'cuizin']}
      />
      <BreadcrumbSchema items={breadcrumbs} />

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            <BrainCircuit className="w-3.5 h-3.5" />
            CuizIN Knowledge Graph
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Explore Entities &amp; Topic Nodes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Navigate our interconnected network of notable people, world landmarks, historic events, and foundational scientific concepts linked with fact-checked trivia questions.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <Button
              size="sm"
              variant={selectedType === 'all' ? 'default' : 'outline'}
              className="text-xs h-8"
              onClick={() => setSelectedType('all')}
            >
              All Entities ({ENTITY_REGISTRY.length})
            </Button>
            <Button
              size="sm"
              variant={selectedType === 'person' ? 'default' : 'outline'}
              className="text-xs h-8 flex items-center gap-1"
              onClick={() => setSelectedType('person')}
            >
              <User className="w-3 h-3" /> People
            </Button>
            <Button
              size="sm"
              variant={selectedType === 'place' ? 'default' : 'outline'}
              className="text-xs h-8 flex items-center gap-1"
              onClick={() => setSelectedType('place')}
            >
              <MapPin className="w-3 h-3" /> Places
            </Button>
            <Button
              size="sm"
              variant={selectedType === 'event' ? 'default' : 'outline'}
              className="text-xs h-8 flex items-center gap-1"
              onClick={() => setSelectedType('event')}
            >
              <Calendar className="w-3 h-3" /> Events
            </Button>
            <Button
              size="sm"
              variant={selectedType === 'concept' ? 'default' : 'outline'}
              className="text-xs h-8 flex items-center gap-1"
              onClick={() => setSelectedType('concept')}
            >
              <Lightbulb className="w-3 h-3" /> Concepts
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              placeholder="Search knowledge entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>

        {/* Entity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map(entity => {
            const Icon = typeIconMap[entity.type] || User;
            const config = typeConfigMap[entity.type];
            const entityUrl = `${config.prefix}/${entity.slug}`;

            return (
              <Card 
                key={entity.slug}
                className="bg-card text-card-foreground hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] py-0 px-2 flex items-center gap-1">
                      <Icon className="w-2.5 h-2.5" />
                      {config.label}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {entity.category}
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                    <Link to={entityUrl} className="hover:underline">
                      {entity.name}
                    </Link>
                  </CardTitle>

                  {entity.roleOrDesignation && (
                    <CardDescription className="text-xs font-medium text-foreground/80 line-clamp-1">
                      {entity.roleOrDesignation}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {entity.summary}
                  </p>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      {entity.keyFacts.length} Verified Facts
                    </span>
                    <Button size="sm" variant="ghost" asChild className="h-7 text-xs p-0 text-primary hover:bg-transparent font-semibold">
                      <Link to={entityUrl}>
                        View Entity Node &rarr;
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredEntities.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border p-6 space-y-2">
            <Search className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-sm text-foreground">No entities matched your search</h3>
            <p className="text-xs text-muted-foreground">Try clearing your search query or selecting a different category filter.</p>
          </div>
        )}
      </main>
    </PageLayout>
  );
};

export default EntitiesDirectoryPage;
