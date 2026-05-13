-- RLS helper functions: current_brand_id() and current_community_owner_id().
--
-- These mirror the attribute stack used by public.is_admin() in 05_admins.sql
-- (LANGUAGE sql, SECURITY DEFINER, STABLE, SET search_path = public) so they
-- can be called from RLS policies without being blocked by RLS on the
-- brands / community_owners tables themselves, and so the planner can cache
-- the result within a single statement.
--
-- Each function returns NULL when the calling user is not a brand /
-- community owner. RLS policies that compare another column to a NULL
-- result (e.g. WHERE brand_id = current_brand_id()) evaluate the predicate
-- to NULL, which RLS treats as "not permitted" — so an unrelated user is
-- denied automatically. This is the fail-closed behaviour we want for the
-- default-deny posture being established in migrations 07 and 08.

CREATE OR REPLACE FUNCTION public.current_brand_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.brands WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_community_owner_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.community_owners WHERE user_id = auth.uid();
$$;
