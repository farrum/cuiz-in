-- Migration to add an RPC for fetching a deterministic hourly Wordle question

CREATE OR REPLACE FUNCTION get_hourly_wordle()
RETURNS TABLE (
  question TEXT,
  correct_answer TEXT
) AS $$
DECLARE
  seed_val double precision;
BEGIN
  -- Generate a deterministic seed based on the current date and hour (UTC)
  -- This ensures every user gets the exact same Wordle for the entire hour
  seed_val := extract(epoch from date_trunc('hour', now())) / 3600.0;
  
  -- Set the random seed for this transaction
  PERFORM setseed(seed_val / 1000000.0); -- setseed expects a value between -1 and 1

  RETURN QUERY
  SELECT 
    q.question, 
    q.correct_answer
  FROM quiz_questions q
  WHERE 
    -- Must be a single word (no spaces)
    q.correct_answer NOT LIKE '% %'
    -- Must be purely alphabetical
    AND q.correct_answer ~ '^[a-zA-Z]+$'
    -- Must be a reasonable length for Wordle
    AND length(q.correct_answer) BETWEEN 4 AND 8
  ORDER BY random()
  LIMIT 1;
  
  -- Reset seed to normal random behavior for subsequent queries
  PERFORM setseed(random());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
