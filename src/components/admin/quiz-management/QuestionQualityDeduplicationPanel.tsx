import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ArrowRight, 
  RefreshCw, 
  FileSpreadsheet, 
  Edit3,
  ShieldAlert,
  Layers,
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuestionQualityDeduplicationProps {
  questions: any[];
  onRefreshQuestions: () => void;
}

interface DuplicatePair {
  id: string;
  similarity: number;
  q1: any;
  q2: any;
}

// Token-based Jaccard similarity
function computeSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;
  const normalize = (t: string) => 
    t.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

  const tokensA = new Set(normalize(textA));
  const tokensB = new Set(normalize(textB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
}

export const QuestionQualityDeduplicationPanel: React.FC<QuestionQualityDeduplicationProps> = ({
  questions,
  onRefreshQuestions
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'duplicates' | 'missing-explanations'>('duplicates');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.75);
  const [searchFilter, setSearchFilter] = useState('');
  const [dismissedPairs, setDismissedPairs] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);

  // Edit question modal
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editExplanation, setEditExplanation] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // 1. Detect near duplicates
  const duplicatePairs = useMemo(() => {
    const pairs: DuplicatePair[] = [];
    if (!questions || questions.length < 2) return pairs;

    // Scan a batch of up to 400 questions to prevent main-thread lag
    const pool = questions.slice(0, 400);

    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const q1 = pool[i];
        const q2 = pool[j];
        
        // Skip if same category and dismissed
        const pairKey = [q1.id, q2.id].sort().join('_');
        if (dismissedPairs.has(pairKey)) continue;

        const sim = computeSimilarity(q1.question, q2.question);
        if (sim >= similarityThreshold) {
          pairs.push({
            id: pairKey,
            similarity: Math.round(sim * 100),
            q1,
            q2
          });
        }
      }
    }

    return pairs.sort((a, b) => b.similarity - a.similarity);
  }, [questions, similarityThreshold, dismissedPairs]);

  // 2. Detect questions with missing explanations or questionable lengths
  const qualityFlags = useMemo(() => {
    if (!questions) return [];
    return questions.filter(q => {
      const expl = (q.explanation || '').trim();
      return expl.length < 15;
    });
  }, [questions]);

  // Actions
  const handleDismissPair = (pairId: string) => {
    setDismissedPairs(prev => new Set(prev).add(pairId));
    toast.info('Duplicate pair dismissed from review.');
  };

  const handleDeleteDuplicate = async (deleteId: string, keepId: string, pairId: string) => {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Duplicate question removed successfully.');
      handleDismissPair(pairId);
      onRefreshQuestions();
    } catch (err: any) {
      console.error('Failed to delete question:', err);
      toast.error(`Error removing duplicate: ${err.message}`);
    }
  };

  const handleSaveExplanation = async () => {
    if (!editingQuestion) return;
    setIsSubmittingEdit(true);
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .update({
          explanation: editExplanation,
          correct_answer: editAnswer
        })
        .eq('id', editingQuestion.id);

      if (error) throw error;

      toast.success('Question explanation updated successfully.');
      setEditingQuestion(null);
      onRefreshQuestions();
    } catch (err: any) {
      console.error('Failed to update question:', err);
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const exportDuplicatesCsv = () => {
    if (duplicatePairs.length === 0) {
      toast.error('No duplicate pairs to export.');
      return;
    }

    const headers = ['Similarity %', 'Question A (ID)', 'Question A Text', 'Answer A', 'Question B (ID)', 'Question B Text', 'Answer B'];
    const rows = duplicatePairs.map(p => [
      `${p.similarity}%`,
      p.q1.id,
      `"${(p.q1.question || '').replace(/"/g, '""')}"`,
      `"${(p.q1.correct_answer || '').replace(/"/g, '""')}"`,
      p.q2.id,
      `"${(p.q2.question || '').replace(/"/g, '""')}"`,
      `"${(p.q2.correct_answer || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuizin_duplicate_questions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Duplicate audit CSV exported.');
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Near Duplicates Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {duplicatePairs.length} Pairs
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Questions with &gt; {Math.round(similarityThreshold * 100)}% token overlap
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              Missing Explanations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {qualityFlags.length} Items
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Questions needing authoritative context for SEO &amp; AI grounding
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              Total Questions Audited
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {questions?.length || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Active question bank in database
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control & Tab Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={activeSubTab === 'duplicates' ? 'default' : 'outline'}
            className="text-xs h-8"
            onClick={() => setActiveSubTab('duplicates')}
          >
            Near Duplicates ({duplicatePairs.length})
          </Button>
          <Button
            size="sm"
            variant={activeSubTab === 'missing-explanations' ? 'default' : 'outline'}
            className="text-xs h-8"
            onClick={() => setActiveSubTab('missing-explanations')}
          >
            Missing Explanations ({qualityFlags.length})
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'duplicates' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Threshold:</span>
              <select
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="h-8 px-2 rounded-md border text-xs bg-background text-foreground"
              >
                <option value="0.65">65% (Loose)</option>
                <option value="0.75">75% (Standard)</option>
                <option value="0.85">85% (Strict)</option>
                <option value="0.95">95% (Exact)</option>
              </select>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={exportDuplicatesCsv}
            className="text-xs h-8 flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Audit CSV
          </Button>
        </div>
      </div>

      {/* View: Near Duplicates */}
      {activeSubTab === 'duplicates' && (
        <div className="space-y-4">
          {duplicatePairs.length === 0 ? (
            <Card className="p-8 text-center bg-card text-card-foreground">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-semibold text-base">No Near Duplicates Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                All audited questions in the selected pool satisfy the uniqueness threshold of {Math.round(similarityThreshold * 100)}%.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {duplicatePairs.map((pair) => (
                <Card key={pair.id} className="bg-card text-card-foreground p-4 border shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold">
                        {pair.similarity}% Match
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        Category: {pair.q1.category}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 text-muted-foreground hover:text-foreground"
                      onClick={() => handleDismissPair(pair.id)}
                    >
                      Dismiss Pair (Mark Distinct)
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Question 1 */}
                    <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-muted-foreground">ID: {pair.q1.id}</div>
                        <p className="text-xs sm:text-sm font-semibold text-foreground">{pair.q1.question}</p>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Ans: {pair.q1.correct_answer || (Array.isArray(pair.q1.options) ? pair.q1.options[0] : '')}
                        </div>
                        {pair.q1.explanation && (
                          <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                            "{pair.q1.explanation}"
                          </p>
                        )}
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs flex items-center gap-1"
                          onClick={() => handleDeleteDuplicate(pair.q1.id, pair.q2.id, pair.id)}
                        >
                          <Trash2 className="w-3 h-3" /> Delete This
                        </Button>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {pair.q1.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Question 2 */}
                    <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-muted-foreground">ID: {pair.q2.id}</div>
                        <p className="text-xs sm:text-sm font-semibold text-foreground">{pair.q2.question}</p>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Ans: {pair.q2.correct_answer || (Array.isArray(pair.q2.options) ? pair.q2.options[0] : '')}
                        </div>
                        {pair.q2.explanation && (
                          <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                            "{pair.q2.explanation}"
                          </p>
                        )}
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs flex items-center gap-1"
                          onClick={() => handleDeleteDuplicate(pair.q2.id, pair.q1.id, pair.id)}
                        >
                          <Trash2 className="w-3 h-3" /> Delete This
                        </Button>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {pair.q2.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View: Missing Explanations */}
      {activeSubTab === 'missing-explanations' && (
        <div className="space-y-4">
          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Questions Missing Explanations ({qualityFlags.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Search engines and AI models require rich factual explanations to cite questions as reliable knowledge nodes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {qualityFlags.slice(0, 30).map((q) => (
                  <div 
                    key={q.id}
                    className="p-3 bg-muted/40 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0">{q.category}</Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">{q.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">{q.question}</p>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Ans: {q.correct_answer || (Array.isArray(q.options) ? q.options[0] : '')}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0 flex items-center gap-1"
                      onClick={() => {
                        setEditingQuestion(q);
                        setEditExplanation(q.explanation || '');
                        setEditAnswer(q.correct_answer || '');
                      }}
                    >
                      <Edit3 className="w-3 h-3" /> Add Context / Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add Explanation &amp; Citations</DialogTitle>
              <DialogDescription className="text-xs">
                Enhance question grounding for AI crawlers and search engine rich snippets.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Question</label>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{editingQuestion.question}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Correct Answer</label>
                <Input
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Detailed Explanation / Context</label>
                <Textarea
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  placeholder="Provide background context, historical date, or scientific rationale..."
                  className="text-xs min-h-[100px] mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditingQuestion(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveExplanation} disabled={isSubmittingEdit}>
                {isSubmittingEdit ? 'Saving...' : 'Save Explanation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default QuestionQualityDeduplicationPanel;
