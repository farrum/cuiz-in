

## Problem

The `EnhancedQuizCard` (the main inline quiz component) shows only "Correct!/Wrong!" feedback but **never displays the explanation**, even though:
1. The `validate-quiz-answer` edge function returns `explanation`
2. The component already saves it to `question.explanation` (line 178)
3. The old `ResultCard` on `/answer/` pages does show explanations

The 1.5-second auto-advance timer is also too fast for users to read any explanation. This hurts SEO because answer pages with rich explanatory content drive search indexing.

## Plan

### 1. Add explanation display to EnhancedQuizCard

In `src/components/quiz/EnhancedQuizCard.tsx`, add an explanation section in the feedback area (after the "Correct!/Wrong!" banner, lines 496-534):

- Show `question.explanation` when available, styled as an informational block
- Display for both correct and incorrect answers
- Include a visible heading like "💡 Did you know?" or "📖 Explanation"

### 2. Increase auto-advance delay

Change the auto-advance timeout from 1.5s to 5s (line 248: `setTimeout(() => { onComplete(...) }, 1500)`) to give users time to read the explanation. This matches the countdown timer used on the old answer page flow.

### 3. Ensure AnswerPage also shows explanation prominently

The `ResultCard` component already shows `question.explanation` (line ~85 in ResultCard.tsx), and the `AnswerPage` passes it through. However, the explanation depends on `question.explanation` being populated from the server response in `useQuizAnswer.ts`. Verify this path works — line 78 in `useQuizAnswer.ts` sets `foundQuestion.correctAnswer` from the server but doesn't set `explanation`. Fix this to also set `foundQuestion.explanation = data.explanation`.

### Files to change

1. **`src/components/quiz/EnhancedQuizCard.tsx`**
   - Add explanation display block after the feedback/points section (after line 534)
   - Increase auto-advance delay from 1500ms to 5000ms

2. **`src/hooks/useQuizAnswer.ts`**
   - After line 78 (`foundQuestion.correctAnswer = data.correct_answer`), add: `foundQuestion.explanation = data.explanation || foundQuestion.explanation`
   - This ensures the `/answer/` page also shows server-provided explanations

