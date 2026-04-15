import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch batch of questions needing explanations
    const { data: questions, error: fetchError } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, question, correct_answer, category, difficulty, explanation')
      .or('explanation.is.null,explanation.eq.')
      .limit(20);

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Also get short explanations if no nulls/empty left
    let batch = questions || [];
    if (batch.length < 20) {
      const { data: shortOnes } = await supabaseAdmin
        .from('quiz_questions')
        .select('id, question, correct_answer, category, difficulty, explanation')
        .not('explanation', 'is', null)
        .neq('explanation', '')
        .limit(20 - batch.length);
      
      // Filter to only short ones client-side
      const short = (shortOnes || []).filter(q => (q.explanation || '').length < 50);
      batch = [...batch, ...short];
    }

    if (batch.length === 0) {
      return new Response(JSON.stringify({ message: 'All questions have explanations!', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const q of batch) {
      try {
        const prompt = `Question: "${q.question}"
Correct Answer: "${q.correct_answer}"
Category: "${q.category}"
Difficulty: "${q.difficulty || 'medium'}"

Write a 1-2 sentence factual explanation of why "${q.correct_answer}" is the correct answer. Be educational and concise. Do not repeat the question. Do not start with "The correct answer is". Just explain the fact.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'You are a trivia expert. Write brief, factual explanations for quiz answers. Keep each explanation to 1-2 sentences maximum.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: 150,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for ${q.id}: ${aiResponse.status}`);
          errors++;
          // Rate limit - wait
          if (aiResponse.status === 429) {
            await new Promise(r => setTimeout(r, 5000));
          }
          continue;
        }

        const aiData = await aiResponse.json();
        const explanation = aiData.choices?.[0]?.message?.content?.trim();

        if (explanation && explanation.length > 10) {
          const { error: updateError } = await supabaseAdmin
            .from('quiz_questions')
            .update({ explanation })
            .eq('id', q.id);

          if (updateError) {
            console.error(`Update error for ${q.id}:`, updateError);
            errors++;
          } else {
            processed++;
          }
        } else {
          errors++;
        }

        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`Error processing ${q.id}:`, e);
        errors++;
      }
    }

    return new Response(JSON.stringify({
      processed,
      errors,
      batch_size: batch.length,
      message: `Processed ${processed}/${batch.length} questions. ${errors} errors. Run again to process more.`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
