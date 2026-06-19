import React, { useState, useEffect } from 'react';
import { SpinTheWheel } from '@/components/gamification/SpinTheWheel';
import { ScratchCard } from '@/components/gamification/ScratchCard';
import { CoinFlip } from '@/components/gamification/CoinFlip';
import { DiceRoll } from '@/components/gamification/DiceRoll';
import { LuckyCardDraw } from '@/components/gamification/LuckyCardDraw';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DailyRewardsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('spin');
  const [scratchPrize, setScratchPrize] = useState<{ label: string; value: number } | null>(null);
  const [scratchState, setScratchState] = useState<'idle' | 'loading' | 'ready' | 'already' | 'unauth' | 'error'>('idle');
  const { toast } = useToast();

  const handleSpinComplete = (prize: any) => {
    // In a real app, this would call Supabase to add the prize to the user's account
    console.log("Won prize:", prize);
  };

  const fetchDailyScratch = async () => {
    setScratchState('loading');
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      setScratchState('unauth');
      return;
    }
    try {
      const { data, error } = await (supabase as any).rpc('process_scratch_card', { p_context: 'daily' });
      if (error) throw error;
      if (data?.already_played) {
        setScratchState('already');
        return;
      }
      if (data?.error) {
        setScratchState('error');
        return;
      }
      setScratchPrize({ label: data.label, value: data.value });
      setScratchState('ready');
    } catch (err) {
      console.error('Daily scratch error:', err);
      setScratchState('error');
    }
  };

  useEffect(() => {
    if (activeTab === 'scratch' && scratchState === 'idle') {
      fetchDailyScratch();
    }
  }, [activeTab]);

  const handleScratchComplete = () => {
    if (scratchPrize && scratchPrize.value > 0) {
      toast({ title: '🎉 You won!', description: `${scratchPrize.label} added to your balance.` });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent inline-flex items-center gap-2">
          <Gift className="text-purple-500" />
          Daily Rewards
        </h2>
        <p className="text-muted-foreground mt-2">Come back every day for free rewards and gems!</p>
      </div>

      <Card className="border-2 border-purple-100 shadow-xl shadow-purple-100/20">
        <CardHeader className="bg-purple-50/50 border-b border-purple-100 rounded-t-xl pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5">
              <TabsTrigger value="spin" className="font-bold text-xs">Spin Wheel</TabsTrigger>
              <TabsTrigger value="scratch" className="font-bold text-xs">Scratch Card</TabsTrigger>
              <TabsTrigger value="coin" className="font-bold text-xs">Coin Flip</TabsTrigger>
              <TabsTrigger value="dice" className="font-bold text-xs">Dice Roll</TabsTrigger>
              <TabsTrigger value="card" className="font-bold text-xs">Lucky Card</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-8 flex justify-center items-center min-h-[450px] relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          {activeTab === 'spin' && (
            <div className="relative z-10 w-full animate-in fade-in zoom-in-95 duration-300">
              <SpinTheWheel onSpinComplete={handleSpinComplete} canSpin={true} />
            </div>
          )}

          {activeTab === 'scratch' && (
            <div className="relative z-10 w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Daily Scratch Card</h3>
                <p className="text-sm text-slate-500">Scratch to reveal your prize!</p>
              </div>

              {scratchState === 'loading' && (
                <p className="text-sm text-slate-500">Preparing your card...</p>
              )}
              {scratchState === 'unauth' && (
                <p className="text-sm text-slate-600 text-center max-w-xs">Sign in to claim your free daily scratch card!</p>
              )}
              {scratchState === 'already' && (
                <p className="text-sm text-slate-600 text-center max-w-xs">You already scratched today's card. Come back tomorrow!</p>
              )}
              {scratchState === 'error' && (
                <p className="text-sm text-red-600 text-center max-w-xs">Something went wrong. Please try again later.</p>
              )}
              {scratchState === 'ready' && scratchPrize && (
                <ScratchCard
                  width={320}
                  height={160}
                  onComplete={handleScratchComplete}
                  coverColor="#e2e8f0"
                >
                  <div className="flex flex-col items-center text-center">
                    <Sparkles className="text-yellow-500 mb-2" size={32} />
                    <h4 className="text-2xl font-black text-slate-800 uppercase tracking-wider">
                      {scratchPrize.label}
                    </h4>
                    <p className="text-sm font-bold text-green-600">
                      {scratchPrize.value > 0 ? 'You Won!' : 'Try again tomorrow'}
                    </p>
                  </div>
                </ScratchCard>
              )}
            </div>
          )}

          {activeTab === 'coin' && (
            <div className="relative z-10 w-full animate-in fade-in zoom-in-95 duration-300">
              <CoinFlip />
            </div>
          )}

          {activeTab === 'dice' && (
            <div className="relative z-10 w-full animate-in fade-in zoom-in-95 duration-300">
              <DiceRoll />
            </div>
          )}

          {activeTab === 'card' && (
            <div className="relative z-10 w-full animate-in fade-in zoom-in-95 duration-300">
              <LuckyCardDraw />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyRewardsSection;
