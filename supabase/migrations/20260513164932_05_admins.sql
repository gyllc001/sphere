-- Admins table + Supabase Auth integration helpers.
--
-- (a) user_id is nullable and ON DELETE SET NULL for the same reason
--     brands.user_id and community_owners.user_id are: if an auth.users
--     row is deleted (e.g. a Sphere staff member leaves and their
--     Supabase Auth account is removed), we want to preserve the
--     historical admins row — including its name, email, and any
--     audit-trail references from other tables — rather than cascade
--     a destructive delete through the system. The row becomes
--     orphaned (cannot log in) but stays intact for history.
--
-- (b) public.is_admin(uid) and public.is_super_admin(uid) are SQL
--     helpers intended to be called from RLS policies in the Step 4
--     migration, e.g.
--       USING (is_admin(auth.uid()) OR brand_owns_row(...))
--     They are SECURITY DEFINER so RLS on the admins table itself
--     does not block the lookup, STABLE so the planner can cache
--     within a statement, and pinned to search_path = public as a
--     standard hardening measure against search_path hijacking.
--
-- (c) This migration only stands up the data model and helpers.
--     The legacy API-key admin auth in apps/api/src/routes/admin.ts
--     is intentionally left untouched here; it will be retired in a
--     later migration step once the Supabase-backed admin login UI
--     and Next.js admin routes are in place.

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  role admin_role NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = uid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = uid AND role = 'super_admin'
  );
$$;
