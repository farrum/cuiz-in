-- Set the first user 'player' as admin
UPDATE public.profiles
SET is_admin = true
WHERE username = 'player';

-- Add admin role to the user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE username = 'player'
ON CONFLICT (user_id, role) DO NOTHING;