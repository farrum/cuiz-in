import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const VALID_EVENTS = ['page_view', 'answer', 'limit_reached', 'registered']

function detectDevice(ua: string): string {
  const s = (ua || '').toLowerCase()
  if (/ipad|tablet/.test(s)) return 'tablet'
  if (/mobi|android|iphone/.test(s)) return 'mobile'
  if (!s) return 'unknown'
  return 'desktop'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => null)
    const rawEvents = Array.isArray(body?.events) ? body.events : (body ? [body] : [])

    if (!rawEvents.length) {
      return new Response(JSON.stringify({ error: 'No events provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ua = req.headers.get('user-agent') || ''
    const device = detectDevice(ua)
    const country =
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('x-country') ||
      'unknown'

    const rows = rawEvents
      .filter((e: Record<string, unknown>) =>
        e && typeof e.session_id === 'string' &&
        typeof e.event_type === 'string' &&
        VALID_EVENTS.includes(e.event_type as string))
      .slice(0, 50)
      .map((e: Record<string, unknown>) => ({
        session_id: String(e.session_id).slice(0, 128),
        event_type: e.event_type,
        path: e.path ? String(e.path).slice(0, 512) : null,
        question_id: typeof e.question_id === 'string' && e.question_id ? e.question_id : null,
        correct: typeof e.correct === 'boolean' ? e.correct : null,
        points: typeof e.points === 'number' ? e.points : null,
        country,
        device,
        referrer: e.referrer ? String(e.referrer).slice(0, 512) : null,
      }))

    if (!rows.length) {
      return new Response(JSON.stringify({ error: 'No valid events' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error } = await supabase.from('guest_events').insert(rows)
    if (error) {
      console.error('guest_events insert error', error)
      return new Response(JSON.stringify({ error: 'Insert failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('track-guest-event error', err)
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})