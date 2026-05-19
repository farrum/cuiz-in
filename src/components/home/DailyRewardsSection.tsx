import React, { useState } from 'react';
import { SpinTheWheel } from '@/components/gamification/SpinTheWheel';
import { ScratchCard } from '@/components/gamification/ScratchCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Sparkles } from 'lucide-react';

const DailyRewardsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('spin');

  const handleSpinComplete = (prize: any) => {
    // In a real app, this would call Supabase to add the prize to the user's account
    console.log("Won prize:", prize);
  };

  const handleScratchComplete = () => {
    // In a real app, this would reveal and claim the prize
    console.log("Scratch card revealed!");
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
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="spin" className="font-bold">Spin The Wheel</TabsTrigger>
              <TabsTrigger value="scratch" className="font-bold">Scratch Card</TabsTrigger>
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
              
              <ScratchCard 
                width={320} 
                height={160} 
                onComplete={handleScratchComplete}
                coverColor="#e2e8f0" // slate-200
              >
                <div className="flex flex-col items-center text-center">
                  <Sparkles className="text-yellow-500 mb-2" size={32} />
                  <h4 className="text-2xl font-black text-slate-800 uppercase tracking-wider">50 Gems</h4>
                  <p className="text-sm text-green-600 font-bold">You Won!</p>
                </div>
              </ScratchCard>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyRewardsSection;
