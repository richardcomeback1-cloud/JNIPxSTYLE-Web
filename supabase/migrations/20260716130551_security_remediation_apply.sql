/*
# Security Remediation: search_path, EXECUTE grants, RLS, Storage

## Overview
Fixes five categories of security findings from the database audit.

## 1. Function Search Path Mutable
Three SECURITY DEFINER / trigger functions had no pinned search_path, allowing
search_path manipulation. All are redefined with an explicit SET search_path.

- get_all_user_emails  -> SET search_path = 'public', 'pg_catalog', 'pg_temp'
- get_customer_stats   -> SET search_path = 'public', 'pg_catalog', 'pg_temp'
- update_updated_at    -> SET search_path = 'pg_catalog', 'pg_temp'

(handle_new_user, is_admin, sync_admin_metadata already pin search_path.)

## 2. EXECUTE Privileges on SECURITY DEFINER functions
All SECURITY DEFINER functions previously granted EXECUTE to PUBLIC, meaning
anon and authenticated could call them via /rest/v1/rpc/. This is now locked down:

- REVOKE EXECUTE on all 5 functions FROM PUBLIC, anon, authenticated
- GRANT EXECUTE on is_admin()           TO authenticated  (used in RLS policies)
- GRANT EXECUTE on get_customer_stats() TO authenticated  (admin UI via supabase.rpc)
- handle_new_user, sync_admin_metadata, update_updated_at are trigger-only — no
  EXECUTE grant to anon/authenticated (they fire via triggers, not RPC)
- get_all_user_emails: currently unused by the frontend. Left without an
  anon/authenticated grant. If needed later, grant to authenticated only.

## 3. contact_messages INSERT policy (always-true WITH CHECK)
The insert_contact_messages policy had WITH CHECK (true) scoped to
anon, authenticated — the audit flags this as "always true / bypasses RLS".
This is the INTENDED design for a public contact form (any visitor can submit
without signing in), but the policy name did not document that intent.
We drop and recreate it with a descriptive name and comment, still allowing
public INSERT only. SELECT/UPDATE/DELETE remain admin-only via is_admin().

## 4. Storage: public_read_product_images (broad SELECT)
The product-images bucket is public so object URLs work without auth, but the
SELECT policy on storage.objects also enabled LIST calls, exposing all
filenames/metadata to anyone. We drop that policy. Object GET via signed/public
URL still works. Admin upload/update/delete policies (guarded by is_admin())
are preserved.

## Security Impact
- search_path injection vector removed on 3 functions
- anon can no longer invoke admin/email/trigger functions via RPC
- contact form still works for anonymous visitors; admin verbs still locked down
- storage bucket no longer leaks file listings to the public
*/

-- ============================================================
-- 1. Redefine functions with pinned search_path
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_all_user_emails()
RETURNS TABLE(id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog', 'pg_temp'
AS $function$
  SELECT id, email FROM auth.users;
$function$;

CREATE OR REPLACE FUNCTION public.get_customer_stats()
RETURNS TABLE(
  id uuid, user_id uuid, full_name text, phone text, is_admin boolean,
  loyalty_points integer, addresses jsonb, email text,
  order_count bigint, total_spent numeric, last_order_date timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog', 'pg_temp'
AS $function$
  SELECT
    p.id, p.user_id, p.full_name, p.phone, p.is_admin,
    p.loyalty_points, p.addresses,
    COALESCE(au.email, '-') AS email,
    COALESCE(oc.order_count, 0) AS order_count,
    COALESCE(oc.total_spent, 0) AS total_spent,
    oc.last_order_date
  FROM profiles p
  LEFT JOIN (
    SELECT user_id,
      COUNT(*) AS order_count,
      SUM(total) AS total_spent,
      MAX(created_at) AS last_order_date
    FROM orders
    GROUP BY user_id
  ) oc ON oc.user_id = p.user_id
  LEFT JOIN auth.users au ON au.id = p.user_id
  ORDER BY COALESCE(oc.total_spent, 0) DESC;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'pg_catalog', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- ============================================================
-- 2. Lock down EXECUTE privileges on SECURITY DEFINER functions
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_all_user_emails() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_customer_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_admin_metadata() FROM PUBLIC, anon, authenticated;

-- Grant only where the app actually needs to call via RPC
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_stats() TO authenticated;

-- ============================================================
-- 3. contact_messages: document + scope the public INSERT policy
-- ============================================================

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_contact_messages" ON public.contact_messages;
CREATE POLICY "public_can_submit_contact_messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true); -- intentional: public contact form, anyone may submit

-- ============================================================
-- 4. Storage: remove broad listing policy on product-images
-- ============================================================

DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
-- Object URLs from a public bucket still work for GET; only LIST is now blocked.
