
-- Create trigger for track_user_attendance function to properly track user logins
CREATE OR REPLACE TRIGGER track_user_attendance_trigger
AFTER INSERT ON login_logs
FOR EACH ROW
EXECUTE FUNCTION track_user_attendance();

-- Ensure user_attendance table has proper constraints to prevent duplicates
ALTER TABLE user_attendance DROP CONSTRAINT IF EXISTS unique_user_attendance;
ALTER TABLE user_attendance ADD CONSTRAINT unique_user_attendance UNIQUE (user_id, attendance_date);
