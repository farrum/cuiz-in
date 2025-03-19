
-- Create fun_messages table
CREATE TABLE IF NOT EXISTS fun_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index
CREATE INDEX IF NOT EXISTS fun_messages_type_idx ON fun_messages(type);

-- Add RLS policies
ALTER TABLE fun_messages ENABLE ROW LEVEL SECURITY;

-- Policy for admin users
CREATE POLICY "Admins can manage fun messages"
  ON fun_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy for reading messages
CREATE POLICY "All authenticated users can read fun messages"
  ON fun_messages
  FOR SELECT
  TO authenticated
  USING (true);
