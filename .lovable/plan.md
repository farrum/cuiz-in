
## Goal

Make every image quiz question display a truly relevant image: a real photo of the subject (Malala, the liver, Nobel Prize medal, etc.) instead of a random Unsplash shot. Use Wikipedia as the first source, AI image generation as the fallback.

## Approach

A new edge function `resolve-question-image` returns one relevant image URL for a single question. It runs this pipeline:

1. **Subject extraction (Lovable AI, gemini-3-flash-preview, tool-calling)** — given the question + correct answer + category, return:
   - `subject`: 1–4 word entity to image (e.g. "Malala Yousafzai", "Human liver", "Counter-Strike Global Offensive")
   - `wiki_query`: best Wikipedia search term
   - `is_person_or_object`: boolean (Wikipedia tends to have a usable image)
2. **Wikipedia lookup** — call `https://en.wikipedia.org/w/api.php` with `action=query&prop=pageimages&piprop=original&titles=...` (and a fallback `list=search` to resolve the title first). If `original.source` exists and is a `.jpg/.png/.webp`, use it.
3. **AI fallback** — if Wikipedia returns nothing usable, call the Lovable AI image gateway (`openai/gpt-image-2`, `quality: "low"`, `size: "1024x1024"`) with a prompt built from the subject. Decode the returned base64 and upload to a new Supabase storage bucket `question-images`. Return the public URL.
4. Return `{ imageUrl, source: 'wikipedia' | 'ai' | 'fallback' }`. On total failure, fall back to the current category-based Unsplash URL so the row is never broken.

The function requires admin auth (same `adminUserId` + `user_roles` check pattern used by `admin-create-quiz-question` and `ai-generate-questions`).

## Storage

New public bucket `question-images` (migration). Path: `question-images/{questionId-or-hash}.png`. Public-read; insert/update restricted to service_role (only the edge function writes).

## Wiring into new imports

`src/components/admin/quiz-management/image-quiz/import/LearnImageTriviaDialog.tsx` currently calls the local `getRandomImageForCategory(...)` synchronously. Replace that step with a sequential per-question call to the new edge function (with a small concurrency limit of ~3 to respect rate limits). The toast already shows "Processing questions" so we can update its message to "Finding relevant images..." and show a progress count. If the edge function fails for a question, keep the old category-based URL as a last resort so the import never blocks.

No changes to `saveImageTriviaToDB` or `admin-create-quiz-question`.

## Backfill for existing rows

New edge function `backfill-question-images`:
- Admin-only.
- Fetches a batch (default 10) of `quiz_questions` where `question_type = 'image'` AND (`image_url IS NULL` OR `image_url ILIKE '%unsplash.com%'` OR `image_url ILIKE '%picsum.photos%'`).
- For each, runs the same resolver pipeline above and updates `image_url`.
- Returns `{ processed, updated, errors, remaining }` so the UI can loop.

New admin UI button: in the Image Quiz management section, add **"Re-fetch relevant images"** that loops the backfill function until `remaining === 0`, showing live progress in a toast. Place it in the existing image-quiz import area near `LearnImageTriviaDialog`.

## Technical details

- New files:
  - `supabase/functions/resolve-question-image/index.ts`
  - `supabase/functions/backfill-question-images/index.ts`
  - `src/components/admin/quiz-management/image-quiz/RefetchImagesButton.tsx`
- Updated files:
  - `src/components/admin/quiz-management/image-quiz/import/LearnImageTriviaDialog.tsx` — replace `getRandomImageForCategory` with edge-function call, add progress.
  - Image-quiz management parent component — render `RefetchImagesButton`.
- Migration:
  - Create `question-images` public storage bucket + RLS policies (public read, service_role write).
- Wikipedia call uses a `User-Agent: CuizIN/1.0 (https://cuiz.in)` header and follows redirects; throttled to ~5 req/sec.
- AI image gen prompt template: `"A clear, educational, photo-realistic image of {subject}. Centered, well-lit, no text, no watermark."` For people, append `"professional portrait"`; for objects/concepts, append `"high quality reference photo"`.
- All AI gateway errors (429 / 402) bubble up as JSON with the standard messages.
- `getRandomImageForCategory` is kept as the final fallback only; it is no longer the primary path.

## Out of scope

- Real-time image regeneration on the player side (only at import / backfill time).
- Replacing currently-correct images that happen to live on Unsplash but were manually chosen.
