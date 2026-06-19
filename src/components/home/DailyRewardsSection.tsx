import React, { useState, useEffect } from 'react';
import { SlotMachine, TreasureChest, BalloonPop, PlinkoGame, RockPaperScissors } from '@/components/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DailyRewardsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('slot');
  const { toast } = useToast();

  // Placeholder for any future fetches (e.g., user-specific data)
  useEffect(() => {
    // No-op for now
  }, []);

  const renderGame = () => {
    switch (activeTab) {
      case 'slot':
        return <SlotMachine />;
      case 'chest':
        return <TreasureChest />;
      case 'balloon':
        return <BalloonPop />;
      case 'plinko':
        return <PlinkoGame />;
      case 'rps':
        return <RockPaperScissors />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-5 00 bg-clip-text text-transparent inline-flex items-center gap-2">
          <Gift className="text-purple-500" />
          Daily Rewards
        </h2>
        <p className="text-muted-foreground mt-2">Come back every day for free rewards and gems!</p>
      </div>

      <Card className="border-2 border-purple-100 shadow-xl shadow-purple-100/20">
        <CardHeader className="bg-purple-50/50 border-b border-purple-100 rounded-t-xl pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 gap-2 overflow-x-auto scrollbar-hide">
              <TabsTrigger value="slot" className="font-bold text-xs whitespace-nowrap">Slot Machine</TabsTrigger>
              <TabsTrigger value="chest" className="font-bold text-xs whitespace-nowrap">Treasure Chest</TabsTrigger>
              <TabsTrigger value="balloon" className="font-bold text-xs whitespace-nowrap">Balloon Pop</TabsTrigger>
              <TabsTrigger value="plinko" className="font-bold text-xs whitespace-nowrap">Plinko</TabsTrigger>
              <TabsTrigger value="rps" className="font-bold text-xs whitespace-nowrap">RPS</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-8 flex justify-center items-center min-h-[450px] relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          {renderGame()}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyRewardsSection;
