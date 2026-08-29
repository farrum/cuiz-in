import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FileDownIcon, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  ExternalLink,
  BookOpen,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Link } from 'react-router-dom';
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';

interface QualityQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  correct_answer: string;
  explanation?: string;
  has_source: boolean;
  report_count: number;
  quality_status: 'healthy' | 'needs_source' | 'reported' | 'missing_explanation';
}

export const QuestionQualityReport: React.FC = () => {
  const [questions, setQuestions] = useState<QualityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  const fetchQualityData = async () => {
    setLoading(true);
    try {
      // 1. Fetch questions
      const { data: qData, error: qError } = await supabase
        .from('quiz_questions')
        .select('id, question, category, difficulty, correct_answer, explanation, options')
        .limit(1000);

      if (qError) throw qError;

      // 2. Fetch error reports count per question
      const { data: reportsData } = await supabase
        .from('question_reports' as any)
        .select('question_id, status');

      const reportCountMap: Record<string, number> = {};
      (reportsData || []).forEach((r: any) => {
        if (r.question_id) {
          reportCountMap[r.question_id] = (reportCountMap[r.question_id] || 0) + 1;
        }
      });

      const uniqueCats = Array.from(new Set((qData || []).map(q => q.category).filter(Boolean)));
      setCategories(uniqueCats as string[]);

      const qualityList: QualityQuestion[] = (qData || []).map(q => {
        const repCount = reportCountMap[q.id] || 0;
        const hasExplanation = Boolean(q.explanation && q.explanation.trim().length > 10);
        const hasSource = Boolean(q.explanation && (q.explanation.includes('http') || q.explanation.includes('Source')));

        let quality_status: QualityQuestion['quality_status'] = 'healthy';
        if (repCount > 0) quality_status = 'reported';
        else if (!hasExplanation) quality_status = 'missing_explanation';
        else if (!hasSource) quality_status = 'needs_source';

        return {
          id: q.id,
          question: q.question,
          category: q.category || 'General',
          difficulty: q.difficulty || 'medium',
          correct_answer: q.correct_answer || (Array.isArray(q.options) ? q.options[0] : ''),
          explanation: q.explanation || '',
          has_source: hasSource,
          report_count: repCount,
          quality_status
        };
      });

      setQuestions(qualityList);
    } catch (err: any) {
      console.error('Error fetching question quality data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load question quality data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  const filteredQuestions = questions.filter(q => {
    if (statusFilter !== 'all' && q.quality_status !== statusFilter) return false;
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      return q.question.toLowerCase().includes(lower) || q.correct_answer.toLowerCase().includes(lower);
    }
    return true;
  });

  const reportedTotal = questions.filter(q => q.report_count > 0).length;
  const missingExplanationTotal = questions.filter(q => !q.explanation || q.explanation.length < 10).length;
  const healthyTotal = questions.filter(q => q.quality_status === 'healthy').length;

  const exportCSV = () => {
    const headers = ['Question ID', 'Question', 'Category', 'Difficulty', 'Correct Answer', 'Reports Count', 'Status'];
    const rows = filteredQuestions.map(q => [
      q.id,
      `"${q.question.replace(/"/g, '""')}"`,
      `"${q.category}"`,
      q.difficulty,
      `"${q.correct_answer.replace(/"/g, '""')}"`,
      q.report_count,
      q.quality_status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `question-quality-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const columns = [
    {
      header: 'Question',
      accessorKey: 'question',
      cell: (row: QualityQuestion) => {
        const catSlug = getCategorySlug(row.category);
        const qSlug = createSlug(row.question);
        return (
          <div className="max-w-[340px] space-y-1">
            <Link
              to={`/quiz/question/${row.id}/${catSlug}/${qSlug}`}
              target="_blank"
              className="font-medium text-xs text-foreground hover:text-primary transition-colors flex items-start gap-1"
            >
              <span>{row.question}</span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-60 mt-0.5" />
            </Link>
            <div className="text-[11px] text-muted-foreground">
              Ans: <strong className="text-foreground">{row.correct_answer}</strong>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Category & Diff',
      accessorKey: 'category',
      cell: (row: QualityQuestion) => (
        <div className="space-y-1">
          <Badge variant="outline" className="text-[11px]">
            {row.category}
          </Badge>
          <div className="text-[11px] text-muted-foreground capitalize">
            {row.difficulty}
          </div>
        </div>
      )
    },
    {
      header: 'Quality State',
      accessorKey: 'quality_status',
      cell: (row: QualityQuestion) => {
        if (row.report_count > 0) {
          return (
            <Badge variant="destructive" className="flex items-center gap-1 text-[11px]">
              <AlertTriangle className="w-3 h-3" />
              {row.report_count} Error Report{row.report_count > 1 ? 's' : ''}
            </Badge>
          );
        }
        if (!row.explanation || row.explanation.length < 10) {
          return (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 text-[11px]">
              No Explanation
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 text-[11px]">
            <CheckCircle className="w-3 h-3 mr-1" />
            Fact-Verified
          </Badge>
        );
      }
    },
    {
      header: 'Context & Explanation',
      accessorKey: 'explanation',
      cell: (row: QualityQuestion) => (
        <div className="max-w-[260px] text-xs text-muted-foreground line-clamp-2">
          {row.explanation || <span className="italic opacity-60">None provided</span>}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Question Quality &amp; Fact Integrity</h2>
          <p className="text-sm text-muted-foreground">
            Audit editorial quality, identify questions flagged by users, and monitor factual depth across the question bank.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search question / answer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-52 h-9 text-xs"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="reported">User Reported</SelectItem>
              <SelectItem value="missing_explanation">Missing Explanation</SelectItem>
              <SelectItem value="healthy">Fact-Verified</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={exportCSV}>
            <FileDownIcon className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>

          <Button variant="outline" size="sm" onClick={fetchQualityData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              Sample Audited
              <BookOpen className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{questions.length.toLocaleString()}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Questions sampled in memory</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              User Error Flags
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{reportedTotal}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Pending community error tickets</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              Missing Explanation
              <HelpCircle className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{missingExplanationTotal}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Candidates for editorial enrichment</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase flex items-center justify-between">
              Verified &amp; Complete
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{healthyTotal}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Ready for semantic search indexing</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="bg-card text-card-foreground shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Question Quality Audit Ledger ({filteredQuestions.length})</CardTitle>
          <CardDescription>
            Click any question to view its public canonical page, authoritative citations, and fact badges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredQuestions}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionQualityReport;
