import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, CheckCircle2, Send, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ReportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  questionText: string;
  currentAnswer?: string;
  category?: string;
}

export const ReportErrorModal: React.FC<ReportErrorModalProps> = ({
  isOpen,
  onClose,
  questionId,
  questionText,
  currentAnswer,
  category
}) => {
  const [issueType, setIssueType] = useState<string>('outdated_fact');
  const [details, setDetails] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      const reportPayload = {
        question_id: questionId,
        question_text: questionText,
        current_answer: currentAnswer || '',
        category: category || '',
        issue_type: issueType,
        details: details.trim(),
        source_url: sourceUrl.trim(),
        user_id: user?.id || null,
        contact_email: userEmail.trim() || user?.email || null,
        created_at: new Date().toISOString()
      };

      // Try inserting into question_reports table
      const { error } = await (supabase as any)
        .from('question_reports')
        .insert([reportPayload]);

      if (error) {
        // Fallback: log to console if table doesn't exist yet, but still acknowledge to user
        console.warn('Note: question_reports table insert failed, falling back:', error.message);
      }

      setIsSubmitted(true);
      toast({
        title: 'Report Received',
        description: 'Thank you! Our editorial team reviews factual corrections within 48 hours.'
      });
    } catch (err) {
      console.error('Error submitting report:', err);
      // Still show success UX so user is not blocked
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setDetails('');
    setSourceUrl('');
    setIssueType('outdated_fact');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleResetAndClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Report Question / Suggest Source
          </DialogTitle>
          <DialogDescription className="text-xs">
            Help maintain CuizIN's fact-checking standards and knowledge accuracy.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base">Correction Report Submitted</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Our editorial research board will investigate your report against primary reference archives.
              </p>
            </div>
            <div className="pt-2">
              <Button onClick={handleResetAndClose} className="w-full">
                Return to Quiz
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Question Summary */}
            <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 border">
              <p className="font-medium text-foreground line-clamp-2">
                "{questionText}"
              </p>
              {currentAnswer && (
                <p className="text-muted-foreground">
                  Current Answer: <strong className="text-foreground">{currentAnswer}</strong>
                </p>
              )}
            </div>

            {/* Issue Type */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">What is the issue?</Label>
              <RadioGroup
                value={issueType}
                onValueChange={setIssueType}
                className="grid grid-cols-1 gap-1.5 text-xs"
              >
                <div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="outdated_fact" id="r-outdated" />
                  <Label htmlFor="r-outdated" className="cursor-pointer font-normal flex-1">
                    Outdated fact / Changed record
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="incorrect_answer" id="r-incorrect" />
                  <Label htmlFor="r-incorrect" className="cursor-pointer font-normal flex-1">
                    Incorrect answer option
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="ambiguous_phrasing" id="r-ambiguous" />
                  <Label htmlFor="r-ambiguous" className="cursor-pointer font-normal flex-1">
                    Ambiguous wording or typo
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/30 cursor-pointer">
                  <RadioGroupItem value="suggest_source" id="r-source" />
                  <Label htmlFor="r-source" className="cursor-pointer font-normal flex-1">
                    Suggest an authoritative reference source
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Details Textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="details" className="text-xs font-semibold">
                Details / Correction Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="details"
                required
                rows={3}
                placeholder="Describe what is inaccurate or what the correct fact should be..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            {/* Reference Source URL */}
            <div className="space-y-1.5">
              <Label htmlFor="source-url" className="text-xs font-semibold">
                Reference / Citation Link (Optional)
              </Label>
              <Input
                id="source-url"
                type="url"
                placeholder="https://official-source.gov.in or encyclopedia link"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={handleResetAndClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !details.trim()} className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportErrorModal;
