-- Fix quiz_questions: revoke correct_answer from client-facing roles
REVOKE SELECT (correct_answer) ON quiz_questions FROM anon;
REVOKE SELECT (correct_answer) ON quiz_questions FROM authenticated;

-- Grant SELECT on all OTHER columns explicitly
GRANT SELECT (id, question, options, category, difficulty, explanation, points, created_at, question_type, image_url) ON quiz_questions TO anon;
GRANT SELECT (id, question, options, category, difficulty, explanation, points, created_at, question_type, image_url) ON quiz_questions TO authenticated;

-- Fix user_attendance: replace open insert policy
DROP POLICY IF EXISTS "System can insert attendance" ON user_attendance;
CREATE POLICY "Authenticated users insert own attendance" ON user_attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.uid())::text);