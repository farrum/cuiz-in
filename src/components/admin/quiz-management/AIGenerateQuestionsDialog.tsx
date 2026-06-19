import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/constants';

interface Props {
  categories: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const SUGGESTED_CATEGORIES = [
  'General Knowledge', 'Cricket', 'Bollywood', 'Indian History', 'Geography',
  'Science', 'Sports', 'Entertainment', 'Technology', 'Literature',
  'Mythology', 'Current Affairs', 'Politics', 'Mathematics',
];

const MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (fast, balanced)' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (cheapest)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (best quality, slower)' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (preview)' },
];

const AIGenerateQuestionsDialog: React.FC<Props> = ({ categories, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCats = Array.from(new Set([...SUGGESTED_CATEGORIES, ...categories])).sort();

  const [category, setCategory] = useState<string>('General Knowledge');
  const [subCategory, setSubCategory] = useState<string>('');
  const [amount, setAmount] = useState<number>(50);
  const [difficulty, setDifficulty] = useState<string>('mixed');
  const [indiaPercent, setIndiaPercent] = useState<number>(30);
  const [imagePercent, setImagePercent] = useState<number>(0);
  const [model, setModel] = useState<string>('google/gemini-2.5-flash-lite');

  const handleGenerate = async () => {
    const adminUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!adminUserId) {
      setError('Admin session not found. Please log in again.');
      return;
    }
    if (!category.trim()) {
      setError('Category is required.');
      return;
    }
    setLoading(true); setError(null);
    try {
      toast({ title: 'Generating questions', description: `Asking Lovable AI for ${amount} ${category} questions${imagePercent > 0 ? ' (resolving images may take a minute)' : ''}...` });
      const { data, error: fnError } = await supabase.functions.invoke('ai-generate-questions', {
        body: { adminUserId, category: category.trim(), subCategory: subCategory.trim(), amount, difficulty, indiaPercent, imagePercent, model },
      });
      if (fnError) throw new Error(fnError.message || 'Generation failed');
      const res = data as { saved: number; duplicates: number; errors: number; generated: number; indiaSpecific: number; imagesResolved?: number; error?: string };
      if (res?.error) throw new Error(res.error);
      toast({
        title: 'Done!',
        description: `Saved ${res.saved} new questions (${res.indiaSpecific} India-specific, ${res.imagesResolved ?? 0} with images, ${res.duplicates} duplicates, ${res.errors} errors).`,
      });
      if (res.saved > 0) onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate questions';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center py-1">
        <Sparkles className="h-10 w-10 text-primary mb-2" />
        <h3 className="text-lg font-medium">AI Question Generator</h3>
        <p className="text-sm text-muted-foreground">
          Generate fresh quiz questions with Lovable AI, with built-in India focus.
        </p>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {allCats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Sub-category / focus (optional)</Label>
          <Input
            placeholder="e.g. IPL, Shah Rukh Khan, Mughal era"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          />
        </div>

        <div>
          <Label className="text-sm">Number of questions</Label>
          <Input type="number" min={1} max={50} value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 10)} />
          <p className="text-xs text-muted-foreground mt-1">1–50 per run</p>
        </div>
        <div>
          <Label className="text-sm">Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label className="text-sm flex items-center justify-between">
            <span>India-specific share</span>
            <span className="font-semibold text-primary">{indiaPercent}%</span>
          </Label>
          <Slider
            value={[indiaPercent]} min={0} max={100} step={10}
            onValueChange={(v) => setIndiaPercent(v[0])}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            At least {Math.round((amount * indiaPercent) / 100)} of {amount} questions will be India-focused.
          </p>
        </div>

        <div className="md:col-span-2">
          <Label className="text-sm">AI Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>)
                   : (<><Sparkles className="mr-2 h-4 w-4" />Generate Questions</>)}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default AIGenerateQuestionsDialog;