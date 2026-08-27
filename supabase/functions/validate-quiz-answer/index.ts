import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-app-version, x-app-platform',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question_id, selected_answer } = await req.json();

    if (!question_id || typeof question_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'question_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!selected_answer || typeof selected_answer !== 'string') {
      return new Response(
        JSON.stringify({ error: 'selected_answer is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: question, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('correct_answer, explanation, points, difficulty')
      .eq('id', question_id)
      .maybeSingle();

    if (error || !question) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isCorrect = selected_answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();

    return new Response(
      JSON.stringify({
        is_correct: isCorrect,
        correct_answer: question.correct_answer,
        explanation: question.explanation || '',
        points: question.points || 10,
        difficulty: question.difficulty || 'medium',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
