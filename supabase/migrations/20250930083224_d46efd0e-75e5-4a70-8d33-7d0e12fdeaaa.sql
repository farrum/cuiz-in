-- Add unique constraint to user_roles table
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Add missing admin role for admin users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;