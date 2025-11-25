-- Add admin role for user player3
INSERT INTO user_roles (user_id, role)
VALUES ('c60bc1b0-908e-473b-bddb-34c9a2a07a85', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;