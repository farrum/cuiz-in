import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-app-version, x-app-platform',
};

const KINDS = ['fifty_fifty', 'audience_poll'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const questionId = body?.question_id;
    const kind = body?.kind;

    if (!questionId || typeof questionId !== 'string') {
      return new Response(JSON.stringify({ error: 'question_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!KINDS.includes(kind)) {
      return new Response(JSON.stringify({ error: 'unsupported kind' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: question, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('correct_answer, options')
      .eq('id', questionId)
      .maybeSingle();

    if (error || !question) {
      return new Response(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawOptions = Array.isArray(question.options)
      ? (question.options as unknown[]).map((o) => String(o))
      : [];
    const correct = String(question.correct_answer);
    const wrong = rawOptions.filter((o) => o !== correct);

    if (kind === 'fifty_fifty') {
      const eliminated = wrong.sort(() => 0.5 - Math.random()).slice(0, Math.max(0, wrong.length - 1));
      return new Response(JSON.stringify({ eliminated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // audience_poll — crowd mostly favours the correct answer
    const poll: Record<string, number> = {};
    const correctShare = 45 + Math.floor(Math.random() * 25);
    poll[correct] = correctShare;
    let remaining = 100 - correctShare;
    wrong.forEach((opt, i) => {
      const share = i === wrong.length - 1 ? remaining : Math.floor(Math.random() * (remaining + 1));
      poll[opt] = share;
      remaining -= share;
    });

    return new Response(JSON.stringify({ poll }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
