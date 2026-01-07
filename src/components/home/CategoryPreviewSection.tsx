
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Star } from 'lucide-react';
import { categoriesArray } from '@/utils/categoryData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CategoryPreviewSectionProps {
  className?: string;
}

const CategoryPreviewSection: React.FC<CategoryPreviewSectionProps> = ({ className }) => {
  // Featured categories with badges
  const featuredCategories = [
    { ...categoriesArray[4], badge: 'Most Popular' }, // Entertainment
    { ...categoriesArray[7], badge: 'Trending' }, // General Knowledge
    { ...categoriesArray[1], badge: null }, // Science
    { ...categoriesArray[0], badge: null }, // History
    { ...categoriesArray[5], badge: 'Hot' }, // Sports
    { ...categoriesArray[2], badge: null }, // Geography
  ];

  const getCategoryGradient = (index: number) => {
    const gradients = [
      'from-pink-500/10 to-rose-500/5',
      'from-blue-500/10 to-indigo-500/5',
      'from-green-500/10 to-emerald-500/5',
      'from-amber-500/10 to-orange-500/5',
      'from-purple-500/10 to-violet-500/5',
      'from-cyan-500/10 to-teal-500/5',
    ];
    return gradients[index % gradients.length];
  };

  const getBadgeStyle = (badge: string | null) => {
    if (!badge) return '';
    if (badge === 'Most Popular') return 'bg-gradient-to-r from-pink-500 to-rose-500';
    if (badge === 'Trending') return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (badge === 'Hot') return 'bg-gradient-to-r from-orange-500 to-red-500';
    return 'bg-primary';
  };

  return (
    <section className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
      {/* Section header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Explore Quiz Categories
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose from 8+ categories covering everything from science to entertainment. 
          Find your expertise and start earning!
        </p>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {featuredCategories.map((category, index) => (
          <Link 
            key={category.id}
            to={`/categories/${category.slug}`}
            className="group"
          >
            <div className={cn(
              "category-card relative h-full",
              `bg-gradient-to-br ${getCategoryGradient(index)}`
            )}>
              {/* Badge */}
              {category.badge && (
                <div className={cn(
                  "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold text-white",
                  getBadgeStyle(category.badge)
                )}>
                  {category.badge === 'Most Popular' && <Star className="w-3 h-3 inline mr-1" />}
                  {category.badge === 'Trending' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                  {category.badge}
                </div>
              )}

              {/* Icon */}
              <span className="category-icon block">{category.icon}</span>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {category.description}
              </p>

              {/* Question count */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {category.questionCount}+ questions
                </span>
                <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View all button */}
      <div className="text-center mt-8">
        <Button asChild variant="outline" size="lg" className="group">
          <Link to="/categories">
            View All Categories
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default CategoryPreviewSection;
