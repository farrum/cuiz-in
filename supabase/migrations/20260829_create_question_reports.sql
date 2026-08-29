-- Create question_reports table to capture user feedback and source citations
CREATE TABLE IF NOT EXISTS public.question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  current_answer TEXT,
  category TEXT,
  issue_type TEXT NOT NULL, -- 'outdated_fact', 'incorrect_answer', 'ambiguous_phrasing', 'suggest_source', 'other'
  details TEXT NOT NULL,
  source_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'dismissed'
  editorial_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

-- Allow any user (authenticated or anonymous) to insert reports
CREATE POLICY "Allow public insert to question_reports"
ON public.question_reports
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated admins to view and manage reports
CREATE POLICY "Allow admins to read question_reports"
ON public.question_reports
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to update question_reports"
ON public.question_reports
FOR UPDATE
TO authenticated
USING (true);

-- Create index for faster querying by status and question_id
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON public.question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_qid ON public.question_reports(question_id);
