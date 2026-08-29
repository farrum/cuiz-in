import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SlidersHorizontal, Check } from 'lucide-react';
import { getAvailableCategories } from '@/utils/quizDataService';
import useQuizPreferences, { QuizDifficulty } from '@/hooks/quiz/useQuizPreferences';

const DIFFICULTIES: QuizDifficulty[] = ['easy', 'medium', 'hard'];

interface Props {
  className?: string;
  /** Called after the player applies new preferences (reload the question). */
  onApplied?: () => void;
}

const QuizPreferencesBar: React.FC<Props> = ({ className, onApplied }) => {
  const { prefs, setPrefs } = useQuizPreferences();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [draftCategory, setDraftCategory] = useState<string | null>(prefs.category);
  const [draftDifficulty, setDraftDifficulty] = useState<QuizDifficulty | null>(prefs.difficulty);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    getAvailableCategories()
      .then((list) => setCategories(list || []))
      .catch(() => setCategories([]));
  }, [open, categories.length]);

  useEffect(() => {
    setDraftCategory(prefs.category);
    setDraftDifficulty(prefs.difficulty);
  }, [prefs.category, prefs.difficulty]);

  const apply = () => {
    setPrefs({ category: draftCategory, difficulty: draftDifficulty });
    setOpen(false);
    onApplied?.();
  };

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm"
      >
        <span className="flex items-center gap-2 font-medium">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Quiz preferences
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[55%] text-right">
          {prefs.category || 'All categories'} ·{' '}
          {prefs.difficulty
            ? prefs.difficulty[0].toUpperCase() + prefs.difficulty.slice(1)
            : 'Any difficulty'}
        </span>
      </button>

      {open && (
        <div className="border-t p-3 space-y-3 animate-fade-in">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraftDifficulty(null)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs',
                  draftDifficulty === null
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                )}
              >
                Any
              </button>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDraftDifficulty(d)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs capitalize',
                    draftDifficulty === d
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Category</p>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              <button
                type="button"
                onClick={() => setDraftCategory(null)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs',
                  draftCategory === null
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraftCategory(c)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs',
                    draftCategory === c
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Button size="sm" className="w-full gap-2" onClick={apply}>
            <Check className="h-4 w-4" />
            Apply preferences
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuizPreferencesBar;
