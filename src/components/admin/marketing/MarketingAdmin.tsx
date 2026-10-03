import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Save, Trash2, Send, Plus, Mail } from 'lucide-react';

type Template = { id: string; name: string; subject: string; html_content: string; updated_at: string };
type Campaign = { id: string; name: string; audience: string | null; total_recipients: number; sent_count: number; failed_count: number; status: string; created_at: string };
type Recipient = { email: string; user_id?: string | null; display_name?: string | null; points?: number | null };

const db = supabase as any;

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  let session = data.session;
  // Refresh if missing or about to expire
  if (!session || (session.expires_at && session.expires_at * 1000 < Date.now() + 60_000)) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session ?? session;
  }
  return session?.access_token ?? null;
}

async function callFn(body: Record<string, unknown>) {
  const token = await getAccessToken();
  if (!token) throw new Error('You are not signed in. Please sign in again as an admin.');
  const { data, error } = await supabase.functions.invoke('admin-marketing', {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    let details = error.message;
    try { details = await (error as any).context?.text?.() || details; } catch { /* ignore */ }
    throw new Error(details);
  }
  if (data?.error) throw new Error(data.details ? `${data.error}: ${data.details}` : data.error);
  return data;
}

const sampleVars: Record<string, string> = { display_name: 'Arjun', username: 'Arjun', points: '1250', web_url: 'https://cuiz.in', app_download_url: '#' };
const preview = (s: string) => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => sampleVars[k] ?? '');

export default function MarketingAdmin() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editing, setEditing] = useState<{ id?: string; name: string; subject: string; html_content: string }>({ name: '', subject: '', html_content: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  // Campaign state
  const [templateId, setTemplateId] = useState('');
  const [segment, setSegment] = useState('all');
  const [days, setDays] = useState(7);
  const [minPoints, setMinPoints] = useState(500);
  const [customList, setCustomList] = useState('');
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [batchSize, setBatchSize] = useState(50);
  const [delaySec, setDelaySec] = useState(2);
  const [testEmail, setTestEmail] = useState('');
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [sending, setSending] = useState(false);
  const abortRef = useRef(false);
  const [log, setLog] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([
      db.from('marketing_email_templates').select('*').order('updated_at', { ascending: false }),
      db.from('marketing_campaigns').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (t.data) setTemplates(t.data);
    if (c.data) setCampaigns(c.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveTemplate = async () => {
    if (!editing.name || !editing.subject || !editing.html_content) return toast.error('Name, subject and content are required');
    const payload = { name: editing.name, subject: editing.subject, html_content: editing.html_content };
    const res = editing.id
      ? await db.from('marketing_email_templates').update(payload).eq('id', editing.id).select().maybeSingle()
      : await db.from('marketing_email_templates').insert(payload).select().maybeSingle();
    if (res.error) return toast.error(res.error.message);
    toast.success('Template saved');
    setEditing({ id: res.data?.id, ...payload });
    load();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const { error } = await db.from('marketing_email_templates').delete().eq('id', id);
    if (error) return toast.error(error.message);
    if (editing.id === id) setEditing({ name: '', subject: '', html_content: '' });
    load();
  };

  const generate = async () => {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    try {
      const r = await callFn({ action: 'generate', prompt: aiPrompt });
      setEditing({ name: r.name || 'AI draft', subject: r.subject || '', html_content: r.html || '' });
      toast.success('Draft generated — review and save');
    } catch (e) { toast.error((e as Error).message); } finally { setAiBusy(false); }
  };

  const loadAudience = async () => {
    try {
      if (segment === 'custom') {
        const emails = Array.from(new Set(customList.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))));
        setRecipients(emails.map((email) => ({ email })));
        return;
      }
      const r = await callFn({ action: 'audience', segment, days, minPoints });
      setRecipients(r.recipients || []);
    } catch (e) { toast.error((e as Error).message); }
  };

  const tpl = templates.find((t) => t.id === templateId);

  const sendTest = async () => {
    if (!tpl || !testEmail) return toast.error('Pick a template and enter a test email');
    try {
      const r = await callFn({ action: 'send', subject: `[TEST] ${tpl.subject}`, html: tpl.html_content, recipients: [{ email: testEmail, display_name: 'Admin' }] });
      r.sent ? toast.success('Test email sent') : toast.error('Test failed');
    } catch (e) { toast.error((e as Error).message); }
  };

  const startCampaign = async () => {
    if (!tpl || !recipients?.length) return toast.error('Pick a template and load an audience');
    if (!confirm(`Send "${tpl.subject}" to ${recipients.length} recipients?`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: camp, error } = await db.from('marketing_campaigns').insert({
      name: tpl.name, subject: tpl.subject, template_id: tpl.id, audience: segment,
      total_recipients: recipients.length, created_by: user?.id ?? null,
    }).select().maybeSingle();
    if (error || !camp) return toast.error(error?.message || 'Could not create campaign');

    abortRef.current = false;
    setSending(true);
    setLog([]);
    let sent = 0, failed = 0;
    const size = Math.max(1, Math.min(100, batchSize));
    setProgress({ sent, failed, total: recipients.length });
    for (let i = 0; i < recipients.length; i += size) {
      if (abortRef.current) break;
      const batch = recipients.slice(i, i + size);
      try {
        const r = await callFn({ action: 'send', subject: tpl.subject, html: tpl.html_content, recipients: batch, campaignId: camp.id });
        sent += r.sent || 0; failed += r.failed || 0;
        if (r.error) setLog((l) => [...l, `Batch ${i / size + 1}: ${r.error} ${r.details ?? ''}`]);
      } catch (e) {
        failed += batch.length;
        setLog((l) => [...l, `Batch ${i / size + 1}: ${(e as Error).message}`]);
      }
      setProgress({ sent, failed, total: recipients.length });
      if (i + size < recipients.length) await new Promise((res) => setTimeout(res, delaySec * 1000));
    }
    await db.from('marketing_campaigns').update({ status: abortRef.current ? 'aborted' : 'completed' }).eq('id', camp.id);
    setSending(false);
    toast.success(`Campaign finished: ${sent} sent, ${failed} failed`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Email Marketing</h2>
      </div>
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="send">Send Campaign</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Library</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setEditing({ name: '', subject: '', html_content: '' })}><Plus className="h-4 w-4 mr-1" />New</Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((t) => (
                  <div key={t.id} className={`flex items-center justify-between rounded border p-2 cursor-pointer hover:bg-muted ${editing.id === t.id ? 'border-primary' : ''}`} onClick={() => setEditing(t)}>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                {templates.length === 0 && <p className="text-sm text-muted-foreground">No templates yet.</p>}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">{editing.id ? 'Edit template' : 'New template'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <Label className="flex items-center gap-1"><Sparkles className="h-4 w-4" />Generate with AI</Label>
                  <Textarea rows={2} placeholder="e.g. Remind players inactive for a week to come back for today's daily challenge" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                  <Button size="sm" onClick={generate} disabled={aiBusy}>{aiBusy ? 'Generating…' : 'Generate draft'}</Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                  <div><Label>Subject</Label><Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Email HTML</Label>
                  <Textarea rows={10} className="font-mono text-xs" value={editing.html_content} onChange={(e) => setEditing({ ...editing, html_content: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Tags: {'{{display_name}} {{points}} {{web_url}} {{app_download_url}}'} — an unsubscribe link is added automatically.</p>
                </div>
                <Button onClick={saveTemplate}><Save className="h-4 w-4 mr-1" />Save template</Button>
                <div>
                  <Label>Preview</Label>
                  <div className="rounded border bg-muted p-2 text-sm mb-2"><b>Subject:</b> {preview(editing.subject)}</div>
                  <iframe title="Email preview" sandbox="" className="w-full h-96 rounded border bg-background" srcDoc={preview(editing.html_content)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="send">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Template</Label>
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
                    <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Audience</Label>
                  <Select value={segment} onValueChange={(v) => { setSegment(v); setRecipients(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All registered users</SelectItem>
                      <SelectItem value="web">Web-only players</SelectItem>
                      <SelectItem value="app">Mobile app players</SelectItem>
                      <SelectItem value="inactive">Inactive players</SelectItem>
                      <SelectItem value="top">Players with minimum points</SelectItem>
                      <SelectItem value="custom">Custom email list</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {segment === 'inactive' && <div className="max-w-xs"><Label>Not seen for (days)</Label><Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>}
              {segment === 'top' && <div className="max-w-xs"><Label>Minimum points</Label><Input type="number" value={minPoints} onChange={(e) => setMinPoints(Number(e.target.value))} /></div>}
              {segment === 'custom' && <div><Label>Emails (comma or new line separated)</Label><Textarea rows={4} value={customList} onChange={(e) => setCustomList(e.target.value)} /></div>}
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadAudience}>Load recipients</Button>
                {recipients && <span className="text-sm"><b>{recipients.length}</b> recipients (unsubscribed and suspended users excluded)</span>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 max-w-md">
                <div><Label>Batch size (max 100)</Label><Input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} /></div>
                <div><Label>Pause between batches (s)</Label><Input type="number" value={delaySec} onChange={(e) => setDelaySec(Number(e.target.value))} /></div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div><Label>Test email</Label><Input placeholder="you@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} /></div>
                <Button variant="secondary" onClick={sendTest}>Send test</Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={startCampaign} disabled={sending}><Send className="h-4 w-4 mr-1" />Send campaign</Button>
                {sending && <Button variant="destructive" onClick={() => { abortRef.current = true; }}>Stop</Button>}
              </div>
              {progress && (
                <div className="space-y-1">
                  <Progress value={((progress.sent + progress.failed) / Math.max(1, progress.total)) * 100} />
                  <p className="text-sm">{progress.sent} sent · {progress.failed} failed · {progress.total} total</p>
                </div>
              )}
              {log.length > 0 && <pre className="text-xs bg-muted p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">{log.join('\n')}</pre>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="p-2">Date</th><th className="p-2">Template</th><th className="p-2">Audience</th><th className="p-2">Recipients</th><th className="p-2">Sent</th><th className="p-2">Failed</th><th className="p-2">Status</th></tr></thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
                      <td className="p-2">{c.name}</td><td className="p-2">{c.audience}</td>
                      <td className="p-2">{c.total_recipients}</td><td className="p-2">{c.sent_count}</td>
                      <td className="p-2">{c.failed_count}</td><td className="p-2">{c.status}</td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && <tr><td colSpan={7} className="p-2 text-muted-foreground">No campaigns yet.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
