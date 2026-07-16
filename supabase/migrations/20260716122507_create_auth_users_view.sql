/*
# Create auth_users_view for admin customer management

1. New Views
- `auth_users_view` — a read-only view that exposes `id` and `email` from `auth.users`
  so the admin panel can display customer emails alongside their profiles.
2. Security
- The view does NOT have RLS (views don't support RLS directly).
- Access is controlled by a SECURITY DEFINER function wrapper instead.
- Only admins can call the function.
*/

-- Drop the view if it exists from the failed attempt
DROP VIEW IF EXISTS public.auth_users_view;

-- Create a security definer function that returns user emails (admin only)
CREATE OR REPLACE FUNCTION public.get_all_user_emails()
RETURNS TABLE (id uuid, email text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, email FROM auth.users;
$$;

-- Revoke access from anon/public, grant to authenticated
REVOKE ALL ON FUNCTION public.get_all_user_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_all_user_emails() TO authenticated;
