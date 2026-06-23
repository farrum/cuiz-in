import React, { useState } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, Unlock, KeyRound, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyRiddleVaultProps {
  riddleText: string;
  hasAttemptedToday: boolean;
  onSubmit: (guess: string) => Promise<{ success: boolean; message: string; gemsWon?: number }>;
}

export const DailyRiddleVault: React.FC<DailyRiddleVaultProps> = ({
  riddleText,
  hasAttemptedToday,
  onSubmit
}) => {
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);
  const { toast } = useToast();
  const { showVideoAd, adElement } = useMiniGameVideoAd();
  const haptics = useHaptics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || isSubmitting || hasAttemptedToday) return;

    setIsSubmitting(true);
    haptics('medium');
    try {
      const response = await onSubmit(guess.trim());
      
      showVideoAd(() => {
        if (response.success) {
          haptics('success');
          setResult('success');
          toast({ title: 'Vault Unlocked!', description: response.message, className: 'bg-green-50' });
        } else {
          haptics('error');
          setResult('fail');
          toast({ title: 'Incorrect!', description: response.message, variant: 'destructive' });
        }
        setIsSubmitting(false);
      });
    } catch (err) {
      haptics('error');
      toast({ title: 'Error', description: 'Failed to verify answer.', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  if (hasAttemptedToday && !result) {
    return (
      <div className="flex flex-col items-center max-w-md mx-auto w-full bg-slate-900 rounded-3xl p-8 text-center shadow-xl border border-slate-800">
        <Lock className="w-16 h-16 text-slate-600 mb-6" />
        <h2 className="text-2xl font-bold text-slate-400 mb-2">Vault Locked</h2>
        <p className="text-slate-500">You have already attempted the Daily Riddle today. Come back tomorrow for a new challenge!</p>
      </div>
    );
  }

  if (result === 'success') {
    return (
      <div className="flex flex-col items-center max-w-md mx-auto w-full bg-yellow-50 rounded-3xl p-8 text-center shadow-xl border-4 border-yellow-400 animate-in zoom-in">
        <div className="relative">
          <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-500 animate-pulse" />
          <Unlock className="w-20 h-20 text-yellow-600 mb-6 animate-bounce" />
        </div>
        <h2 className="text-3xl font-black text-yellow-700 mb-4 uppercase tracking-wider">Vault Unlocked!</h2>
        <p className="text-lg text-yellow-600 font-bold">You solved the Daily Riddle and claimed the massive 500 Gem prize!</p>
      </div>
    );
  }

  if (result === 'fail') {
    return (
      <div className="flex flex-col items-center max-w-md mx-auto w-full bg-slate-900 rounded-3xl p-8 text-center shadow-xl border-4 border-red-900 animate-in zoom-in">
        <Lock className="w-20 h-20 text-red-600 mb-6" />
        <h2 className="text-3xl font-black text-red-500 mb-4 uppercase tracking-wider">Vault Sealed</h2>
        <p className="text-lg text-slate-400">That was incorrect. The vault has sealed itself for the day. Try again tomorrow!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full bg-gradient-to-b from-slate-800 to-slate-950 rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-700">
      <div className="flex items-center gap-3 mb-8">
        <KeyRound className="w-8 h-8 text-yellow-500" />
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase">Daily Riddle Vault</h2>
      </div>

      <div className="bg-black/40 border border-slate-700 p-6 rounded-2xl w-full mb-8 relative">
        <div className="absolute -top-3 left-6 bg-yellow-500 text-yellow-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
          One Attempt Only
        </div>
        <p className="text-slate-300 text-lg leading-relaxed text-center font-serif italic mt-2">
          "{riddleText}"
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="relative">
          <Input 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type your answer here..."
            className="h-14 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 text-lg text-center rounded-xl focus-visible:ring-yellow-500"
            disabled={isSubmitting}
            maxLength={30}
          />
        </div>
        <Button 
          type="submit" 
          size="lg" 
          disabled={!guess.trim() || isSubmitting}
          className="h-14 w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-black text-lg rounded-xl uppercase tracking-widest transition-transform active:scale-95"
        >
          {isSubmitting ? 'Verifying...' : 'Unlock Vault'}
        </Button>
      </form>
      
      <p className="text-slate-500 text-xs mt-6 uppercase tracking-wider font-bold">Prize: 500 Gems</p>
      {adElement}
    </div>
  );
};
