import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Save, Settings, Gift, Brain, FileText } from 'lucide-react';

interface WheelPrize {
  id: string;
  label: string;
  color: string;
  value: number;
  probability: number;
}

export const AdminGamificationPanel: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [limits, setLimits] = useState({ free_spins_per_day: 1, free_scratch_cards_per_day: 1 });
  const [jackpotConfig, setJackpotConfig] = useState({ cooldown_days: 30, jackpot_prize_id: '6' });
  const [dailyChallenges, setDailyChallenges] = useState({
    riddle_text: 'I speak without a mouth and hear without ears. What am I?',
    riddle_answer: 'echo',
    wordle_clue: 'Capital of France',
    wordle_answer: 'PARIS'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('gamification_settings')
        .select('*');

      if (error) throw error;

      (data || []).forEach((setting: any) => {
        if (setting.setting_type === 'wheel_prizes') setPrizes(setting.config);
        if (setting.setting_type === 'daily_limits') setLimits(setting.config);
        if (setting.setting_type === 'jackpot_config') setJackpotConfig(setting.config);
        if (setting.setting_type === 'daily_challenges') setDailyChallenges(setting.config);
      });
    } catch (err) {
      console.error('Error fetching gamification settings:', err);
      toast({ title: 'Error', description: 'Could not load settings', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (type: string, config: any) => {
    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('gamification_settings')
        .upsert({ setting_type: type, config: config }, { onConflict: 'setting_type' });

      if (error) throw error;
      toast({ title: 'Success', description: 'Settings saved successfully' });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({ title: 'Error', description: 'Could not save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const addPrize = () => {
    const newPrize: WheelPrize = {
      id: Date.now().toString(),
      label: 'New Prize',
      color: '#cccccc',
      value: 10,
      probability: 10
    };
    setPrizes([...prizes, newPrize]);
  };

  const updatePrize = (index: number, field: keyof WheelPrize, value: any) => {
    const newPrizes = [...prizes];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setPrizes(newPrizes);
  };

  const removePrize = (index: number) => {
    const newPrizes = [...prizes];
    newPrizes.splice(index, 1);
    setPrizes(newPrizes);
  };

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">Loading Gamification Settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Daily Limits & Jackpot Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings size={18} /> General Settings</CardTitle>
            <CardDescription>Configure daily constraints and jackpot cooldowns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Free Wheel Spins (Per Day)</Label>
              <Input 
                type="number" 
                value={limits.free_spins_per_day} 
                onChange={(e) => setLimits({...limits, free_spins_per_day: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Free Scratch Cards (Per Day)</Label>
              <Input 
                type="number" 
                value={limits.free_scratch_cards_per_day} 
                onChange={(e) => setLimits({...limits, free_scratch_cards_per_day: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="pt-4 border-t space-y-2">
              <Label className="text-red-500 font-bold">Jackpot Cooldown (Days)</Label>
              <p className="text-xs text-slate-500 mb-2">Prevent players from winning the jackpot again within this timeframe.</p>
              <Input 
                type="number" 
                value={jackpotConfig.cooldown_days} 
                onChange={(e) => setJackpotConfig({...jackpotConfig, cooldown_days: parseInt(e.target.value) || 0})}
              />
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={() => {
                handleSaveSettings('daily_limits', limits);
                handleSaveSettings('jackpot_config', jackpotConfig);
              }}
              disabled={isSaving}
            >
              <Save size={16} className="mr-2" /> Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Wheel Prizes Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Gift size={18} /> Wheel Prizes</CardTitle>
              <CardDescription>Configure the slices, colors, gem values, and win probabilities</CardDescription>
            </div>
            <Button variant="outline" onClick={addPrize}><Plus size={16} className="mr-2"/> Add Prize</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prizes.map((prize, index) => (
                <div key={prize.id} className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 border rounded-lg bg-slate-50">
                  <div className="w-10 h-10 rounded-full shrink-0 border-2" style={{ backgroundColor: prize.color }} />
                  
                  <div className="space-y-1 flex-1 min-w-[150px]">
                    <Label className="text-xs">Label</Label>
                    <Input value={prize.label} onChange={(e) => updatePrize(index, 'label', e.target.value)} />
                  </div>
                  
                  <div className="space-y-1 w-24">
                    <Label className="text-xs">Color Hex</Label>
                    <Input type="color" className="h-9 px-1" value={prize.color} onChange={(e) => updatePrize(index, 'color', e.target.value)} />
                  </div>
                  
                  <div className="space-y-1 w-32">
                    <Label className="text-xs text-blue-600 font-bold">Gems Value</Label>
                    <Input type="number" value={prize.value} onChange={(e) => updatePrize(index, 'value', parseInt(e.target.value) || 0)} />
                  </div>
                  
                  <div className="space-y-1 w-32">
                    <Label className="text-xs text-orange-500 font-bold">Probability (%)</Label>
                    <Input type="number" value={prize.probability} onChange={(e) => updatePrize(index, 'probability', parseInt(e.target.value) || 0)} />
                  </div>

                  <Button variant="ghost" size="icon" className="text-red-500 shrink-0 mt-6" onClick={() => removePrize(index)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4 mt-4 border-t">
                <div className="text-sm font-bold text-slate-600">
                  Total Probability: <span className={prizes.reduce((a, b) => a + b.probability, 0) !== 100 ? "text-red-500" : "text-green-500"}>
                    {prizes.reduce((a, b) => a + b.probability, 0)}%
                  </span>
                </div>
                <Button 
                  onClick={() => handleSaveSettings('wheel_prizes', prizes)}
                  disabled={isSaving}
                >
                  <Save size={16} className="mr-2" /> Save Wheel Prizes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Challenges Admin */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain size={18} /> Daily Challenges Config</CardTitle>
            <CardDescription>Set the Daily Riddle and Trivia Wordle for all users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Daily Riddle */}
              <div className="space-y-4 border p-4 rounded-xl bg-slate-50">
                <h3 className="font-bold flex items-center gap-2 text-indigo-700"><FileText size={16}/> Daily Riddle</h3>
                <div className="space-y-2">
                  <Label>Riddle Text</Label>
                  <Input 
                    value={dailyChallenges.riddle_text} 
                    onChange={(e) => setDailyChallenges({...dailyChallenges, riddle_text: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exact Answer (case-insensitive)</Label>
                  <Input 
                    value={dailyChallenges.riddle_answer} 
                    onChange={(e) => setDailyChallenges({...dailyChallenges, riddle_answer: e.target.value})}
                  />
                </div>
              </div>

              {/* Trivia Wordle */}
              <div className="space-y-4 border p-4 rounded-xl bg-slate-50">
                <h3 className="font-bold flex items-center gap-2 text-blue-700"><Brain size={16}/> Trivia Wordle</h3>
                <div className="space-y-2">
                  <Label>Clue</Label>
                  <Input 
                    value={dailyChallenges.wordle_clue} 
                    onChange={(e) => setDailyChallenges({...dailyChallenges, wordle_clue: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exact Word (will convert to uppercase)</Label>
                  <Input 
                    value={dailyChallenges.wordle_answer} 
                    onChange={(e) => setDailyChallenges({...dailyChallenges, wordle_answer: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full mt-4" 
              onClick={() => handleSaveSettings('daily_challenges', dailyChallenges)}
              disabled={isSaving}
            >
              <Save size={16} className="mr-2" /> Save Daily Challenges
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
export default AdminGamificationPanel;
