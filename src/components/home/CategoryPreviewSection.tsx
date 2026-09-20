
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
      <div className="flex items-center gap-3 mb-8 max-w-3xl mx-auto">
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
        <div className="text-center px-4">
          <span className="text-xs font-black tracking-[0.25em] uppercase text-amber-900/70 block font-cinzel">
            📜 Royal Archive &amp; Domains
          </span>
          <h2 className="text-xl md:text-2xl font-black text-amber-950 font-cinzel">
            Explore Realm Knowledge
          </h2>
          <p className="text-xs text-amber-800/70 font-semibold mt-0.5">
            Test thy expertise across 12,400+ questions in sciences, history, and lore
          </p>
        </div>
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
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
              "scroll-paper rounded-2xl p-5 relative h-full border-2 border-amber-600/30 shadow-md transition-all duration-300 hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
            )}>
              {/* Badge */}
              {category.badge && (
                <div className={cn(
                  "absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm",
                  getBadgeStyle(category.badge)
                )}>
                  {category.badge === 'Most Popular' && <Star className="w-3 h-3 inline mr-1" />}
                  {category.badge === 'Trending' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                  {category.badge}
                </div>
              )}

              <div>
                {/* Icon */}
                <span className="text-3xl mb-3 block drop-shadow-sm">{category.icon}</span>

                {/* Content */}
                <h3 className="text-base font-black font-cinzel text-amber-950 mb-1 group-hover:text-amber-700 transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-amber-900/70 line-clamp-2 mb-4 font-semibold">
                  {category.description}
                </p>
              </div>

              {/* Question count */}
              <div className="flex items-center justify-between pt-2 border-t border-amber-600/20">
                <span className="text-[11px] font-black text-amber-900/60 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {category.questionCount}+ queries
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 group-hover:text-amber-950 transition-colors">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View all button */}
      <div className="text-center mt-8">
        <Link 
          to="/categories" 
          className="inline-flex items-center btn-royal-gold py-3 px-8 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg group"
        >
          View All Knowledge Domains
          <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
};

export default CategoryPreviewSection;
