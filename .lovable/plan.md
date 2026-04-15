

## Backfill Quiz Question Explanations

### Problem
- 1,030 questions have **empty** explanations
- 23 questions have **very short** (under 50 chars) explanations
- Total needing fixes: **1,053 out of 1,960 questions**
- The code is correct — it displays `question.explanation` — but the data is missing

### Solution

Write a batch script that processes all questions with missing/short explanations and generates proper 1-2 sentence explanations using the question text, correct answer, category, and difficulty as context.

### Approach

1. **Create a Supabase Edge Function** (`backfill-explanations`) that:
   - Fetches batches of questions where `explanation IS NULL OR LENGTH(explanation) < 50`
   - For each question, generates a factual 1-2 sentence explanation using the Gemini API (already available via `GEMINI_API_KEY`)
   - Updates each question's `explanation` field
   - Processes in batches of 20 to avoid timeouts

2. **Prompt template** per question:
   ```
   Question: "{question}"
   Correct Answer: "{correct_answer}"
   Category: "{category}"
   
   Write a 1-2 sentence factual explanation of why this answer is correct.
   Be educational and concise. Do not repeat the question.
   ```

3. **Run the function** multiple times until all 1,053 questions are backfilled

4. **Create a migration** to add a `NOT NULL DEFAULT ''` constraint isn't needed since the column exists — we just need to populate data

### Technical Details

- Edge Function will use `GEMINI_API_KEY` secret (check availability first)
- Process 20 questions per invocation to stay within edge function timeout limits
- Use `maxOutputTokens: 256` per question (explanations are short)
- Update via `supabaseAdmin.from('quiz_questions').update({ explanation }).eq('id', id)`
- Add a simple admin trigger button or just invoke via curl

### Files to create/change

1. **`supabase/functions/backfill-explanations/index.ts`** — New edge function
2. **Deploy and invoke** — Run it repeatedly until all questions are filled

### Alternative (if no AI API key available)

Generate template-based explanations like:
- `"The correct answer is {answer}. {category}-based fact derived from the question context."`
- Less ideal but ensures every question has *something*

