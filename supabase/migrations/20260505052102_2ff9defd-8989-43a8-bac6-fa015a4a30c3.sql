DELETE FROM public.user_roles
WHERE user_id = 'bcd4b7ad-d613-4bfa-be57-753e57b229b9'
  AND role = 'player'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles admin_role
    WHERE admin_role.user_id = 'bcd4b7ad-d613-4bfa-be57-753e57b229b9'
      AND admin_role.role = 'admin'
  );