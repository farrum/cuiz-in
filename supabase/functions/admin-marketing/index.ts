import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-app-version, x-app-platform',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const SITE_URL = 'https://cuiz.in';
const APP_URL = 'https://play.google.com/store/apps/details?id=com.geologon.cuiz&pli=1';
const FROM = 'CuizIN <noreply@cuiz.in>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sign(userId: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`unsub:${userId}`));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function render(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (k in vars ? vars[k] : ''));
}

type Recipient = { email: string; user_id?: string | null; display_name?: string | null; points?: number | null };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  try {
    const url = new URL(req.url);
    // Public unsubscribe link: GET ?unsubscribe=<uid>&t=<sig>
    const unsub = url.searchParams.get('unsubscribe');
    if (unsub) {
      const ok = (await sign(unsub)) === url.searchParams.get('t');
      if (ok) await admin.from('profiles').update({ marketing_unsubscribed: true }).eq('id', unsub);
      return new Response(
        `<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>${ok ? 'You have been unsubscribed from CuizIN updates.' : 'Invalid unsubscribe link.'}</h2><a href="${SITE_URL}">Back to CuizIN</a></body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
      );
    }

    // Admin auth
    const authHeader = (req.headers.get('Authorization') ?? req.headers.get('authorization') ?? '').trim();
    if (!/^bearer\s+/i.test(authHeader)) {
      console.error('admin-marketing: missing Authorization header');
      return json({ error: 'Not signed in. Please sign in again as an admin.' }, 401);
    }
    const token = authHeader.replace(/^bearer\s+/i, '').trim();
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) {
      console.error('admin-marketing auth failed', userErr?.message);
      return json({ error: 'Your session expired. Please sign in again.' }, 401);
    }
    const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Admin access required' }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    if (action === 'audience') {
      const segment = String(body.segment ?? 'all');
      const days = Math.max(1, Math.min(365, Number(body.days) || 7));
      const minPoints = Math.max(0, Number(body.minPoints) || 0);
      const out: Recipient[] = [];
      for (let from = 0; ; from += 1000) {
        let q = admin.from('profiles')
          .select('id, email, display_name, username, points, last_platform, last_seen_at')
          .not('email', 'is', null).eq('marketing_unsubscribed', false).eq('suspended', false)
          .range(from, from + 999);
        if (segment === 'web') q = q.or('last_platform.is.null,last_platform.eq.web');
        if (segment === 'app') q = q.in('last_platform', ['android', 'ios']);
        if (segment === 'inactive') {
          const cutoff = new Date(Date.now() - days * 86400000).toISOString();
          q = q.or(`last_seen_at.is.null,last_seen_at.lt.${cutoff}`);
        }
        if (segment === 'top') q = q.gte('points', minPoints);
        const { data, error } = await q;
        if (error) return json({ error: error.message }, 500);
        for (const p of data ?? []) {
          if (p.email && EMAIL_RE.test(p.email)) out.push({ email: p.email, user_id: p.id, display_name: p.display_name || p.username, points: p.points ?? 0 });
        }
        if (!data || data.length < 1000) break;
      }
      return json({ recipients: out });
    }

    if (action === 'send') {
      const apiKey = Deno.env.get('RESEND_API_KEY');
      if (!apiKey) return json({ error: 'RESEND_API_KEY is not configured' }, 500);
      const subject = String(body.subject ?? '').slice(0, 300);
      const html = String(body.html ?? '');
      const recipients: Recipient[] = Array.isArray(body.recipients) ? body.recipients.slice(0, 100) : [];
      if (!subject || !html || recipients.length === 0) return json({ error: 'subject, html and recipients are required' }, 400);

      const fnUrl = `${supabaseUrl}/functions/v1/admin-marketing`;
      const emails = await Promise.all(recipients.filter((r) => r?.email && EMAIL_RE.test(r.email)).map(async (r) => {
        const name = esc(r.display_name || 'Scholar');
        const vars = { display_name: name, username: name, points: String(r.points ?? 0), web_url: SITE_URL, app_download_url: APP_URL };
        const unsubUrl = r.user_id ? `${fnUrl}?unsubscribe=${encodeURIComponent(r.user_id)}&t=${await sign(r.user_id)}` : '';
        const footer = unsubUrl
          ? `<p style="font-size:11px;color:#888;text-align:center;margin-top:24px">You receive this because you joined CuizIN. <a href="${unsubUrl}" style="color:#888">Unsubscribe</a></p>`
          : '';
        return {
          from: FROM, to: [r.email],
          subject: render(subject, { ...vars, display_name: r.display_name || 'Scholar' }),
          html: render(html, vars) + footer,
          ...(unsubUrl ? { headers: { 'List-Unsubscribe': `<${unsubUrl}>` } } : {}),
        };
      }));

      const resp = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(emails),
      });
      const text = await resp.text();
      if (!resp.ok) {
        console.error(`Resend failed [${resp.status}]: ${text}`);
        if (body.campaignId) await bump(admin, body.campaignId, 0, emails.length);
        return json({ error: 'Resend request failed', status: resp.status, details: text, sent: 0, failed: emails.length }, 200);
      }
      const skipped = recipients.length - emails.length;
      if (body.campaignId) await bump(admin, body.campaignId, emails.length, skipped);
      return json({ sent: emails.length, failed: skipped });
    }

    if (action === 'generate') {
      const key = Deno.env.get('LOVABLE_API_KEY');
      if (!key) return json({ error: 'AI is not configured' }, 500);
      const prompt = String(body.prompt ?? '').slice(0, 2000);
      if (!prompt) return json({ error: 'prompt is required' }, 400);
      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: `You write marketing emails for CuizIN (cuiz.in), a medieval-themed, purely points-based trivia quiz platform with a web site and an Android app. Never mention money, cash or prizes of monetary value. Return ONLY JSON: {"name": short template name, "subject": subject line, "html": email HTML}. HTML must use inline styles only, max-width 560px, dark parchment theme (background #1a1410, text #f5e6c8, gold #c9a227/#e8c35a, Georgia serif), one clear CTA button. You may use merge tags {{display_name}}, {{points}}, {{web_url}}, {{app_download_url}}. Do not add an unsubscribe footer.` },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        const msg = resp.status === 429 ? 'AI rate limit reached, try again shortly' : resp.status === 402 ? 'AI credits exhausted' : 'AI request failed';
        return json({ error: msg, details: t }, resp.status);
      }
      const data = await resp.json();
      let content = String(data?.choices?.[0]?.message?.content ?? '').trim().replace(/^```(json)?/i, '').replace(/```$/, '');
      try { return json(JSON.parse(content)); } catch { return json({ error: 'AI returned invalid output', raw: content }, 500); }
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('admin-marketing error', e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function bump(admin: any, id: string, sent: number, failed: number) {
  const { data } = await admin.from('marketing_campaigns').select('sent_count, failed_count').eq('id', id).maybeSingle();
  if (!data) return;
  await admin.from('marketing_campaigns').update({ sent_count: data.sent_count + sent, failed_count: data.failed_count + failed }).eq('id', id);
}
