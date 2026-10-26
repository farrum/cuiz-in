import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bell, Send, Users } from 'lucide-react';
import { enablePush, PUSH_MESSAGES } from '@/utils/pushNotifications';

const PRESETS = [
  { label: 'Join a squad (Infantry)', segment: 'infantry', title: '⚔️ A lone soldier rarely wins the war', body: 'Join a squad today, fight alongside your banner and climb the ranks faster!', url: '/referral' },
  { label: 'Daily play reminder', segment: 'inactive', title: '🔥 Your streak is waiting!', body: 'Answer today\'s questions to keep your streak burning and earn more points.', url: '/daily' },
  { label: 'New quests', segment: 'all', title: '🏰 New quests unlocked', body: 'Fresh challenges await in the Empire Quest Board. Ride out now!', url: '/empire-quests' },
];

async function call(payload: Record<string, unknown>) {
  const { data: s } = await supabase.auth.getSession();
  const token = s.session?.access_token;
  if (!token) throw new Error('Please sign in again as an admin.');
  const { data, error } = await supabase.functions.invoke('admin-push', { body: payload, headers: { Authorization: `Bearer ${token}` } });
  if (error) {
    const ctx = (error as any).context;
    const detail = ctx?.text ? await ctx.text() : error.message;
    try { throw new Error(JSON.parse(detail).error); } catch (e) { if (e instanceof Error && e.message) throw e; throw new Error(detail); }
  }
  return data;
}

export default function PushAdmin() {
  const [segment, setSegment] = useState('all');
  const [days, setDays] = useState(1);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [count, setCount] = useState<{ devices: number; users: number; totalDevices: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const check = async () => {
    setBusy(true);
    try { setCount(await call({ action: 'audience', segment, days })); } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };
  const send = async (seg = segment) => {
    if (!title || !body) return toast.error('Add a title and message');
    if (seg !== 'me' && !confirm('Send this notification now?')) return;
    setBusy(true); setResult(null);
    try {
      const r = await call({ action: 'send', segment: seg, days, title, body, url });
      const msg = `Delivered to ${r.sent} device(s), ${r.failed} failed${r.removedStale ? `, ${r.removedStale} old devices removed` : ''}.`;
      setResult(msg + (r.errors?.length ? ` Reason: ${r.errors[0]}` : ''));
      r.sent > 0 ? toast.success(msg) : toast.warning(msg);
    } catch (e: any) { toast.error(e.message); setResult(`Failed: ${e.message}`); }
    setBusy(false);
  };

  return (
    <Card className="mt-6">
      <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Push Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p.label} variant="outline" size="sm" onClick={() => { setSegment(p.segment); setTitle(p.title); setBody(p.body); setUrl(p.url); setCount(null); }}>{p.label}</Button>
          ))}
          <Button variant="secondary" size="sm" onClick={async () => toast(PUSH_MESSAGES[await enablePush(true)])}>Enable on this device</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Audience</Label>
            <Select value={segment} onValueChange={(v) => { setSegment(v); setCount(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subscribed players</SelectItem>
                <SelectItem value="infantry">Infantry without a squad</SelectItem>
                <SelectItem value="inactive">Not played recently</SelectItem>
                <SelectItem value="app">Android app only</SelectItem>
                <SelectItem value="web">Website only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {segment === 'inactive' && (
            <div><Label>Inactive for (days)</Label><Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
          )}
          <div><Label>Open page when tapped</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} /></div>
        </div>
        <div><Label>Title</Label><Input maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>Message</Label><Textarea maxLength={300} value={body} onChange={(e) => setBody(e.target.value)} /></div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={busy} onClick={check}><Users className="mr-1 h-4 w-4" /> Count recipients</Button>
          <Button variant="outline" disabled={busy} onClick={() => send('me')}>Send test to my devices</Button>
          <Button disabled={busy} onClick={() => send()}><Send className="mr-1 h-4 w-4" /> {busy ? 'Sending…' : 'Send notification'}</Button>
          {count && <span className="text-sm text-muted-foreground">{count.users} players · {count.devices} devices (of {count.totalDevices} subscribed)</span>}
        </div>
        {result && <p className="rounded-md border border-border bg-muted p-3 text-sm">{result}</p>}
      </CardContent>
    </Card>
  );
}
