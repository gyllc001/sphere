-- Row-Level Security for identity and top-level marketplace tables.
--
-- First of two RLS migrations (07/08). This one covers brands,
-- community_owners, communities, and campaigns. Default-deny posture:
-- enabling RLS without an applicable policy blocks all access, so each
-- table needs explicit policies for SELECT / INSERT / UPDATE / DELETE
-- before it can be used by an end user. Trusted server code (matching
-- engine, webhook handlers, scraper jobs) uses the service_role key,
-- which bypasses RLS entirely.
--
-- Naming convention: <table>_<verb>_<scope>.
-- All CREATE POLICY statements are preceded by DROP POLICY IF EXISTS so
-- this file is safe to re-run.

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- brands
-- ============================================================================

-- A brand can read its own row; admins can read all brand rows.
DROP POLICY IF EXISTS brands_select_self_or_admin ON brands;
CREATE POLICY brands_select_self_or_admin ON brands
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- A new brand row may only be created under the inserter's own auth uid; admins may create on anyone's behalf.
DROP POLICY IF EXISTS brands_insert_self_or_admin ON brands;
CREATE POLICY brands_insert_self_or_admin ON brands
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- A brand can update its own row; admins can update any brand.
DROP POLICY IF EXISTS brands_update_self_or_admin ON brands;
CREATE POLICY brands_update_self_or_admin ON brands
  FOR UPDATE
  USING (user_id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- Only admins may hard-delete a brand row.
DROP POLICY IF EXISTS brands_delete_admin ON brands;
CREATE POLICY brands_delete_admin ON brands
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- community_owners
-- ============================================================================

-- A community owner can read their own row; admins can read all.
DROP POLICY IF EXISTS community_owners_select_self_or_admin ON community_owners;
CREATE POLICY community_owners_select_self_or_admin ON community_owners
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Community-owner rows are created by the inserter for themselves; admins may create on anyone's behalf.
DROP POLICY IF EXISTS community_owners_insert_self_or_admin ON community_owners;
CREATE POLICY community_owners_insert_self_or_admin ON community_owners
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- A community owner can update their own row; admins can update any.
DROP POLICY IF EXISTS community_owners_update_self_or_admin ON community_owners;
CREATE POLICY community_owners_update_self_or_admin ON community_owners
  FOR UPDATE
  USING (user_id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- Only admins may hard-delete a community-owner row.
DROP POLICY IF EXISTS community_owners_delete_admin ON community_owners;
CREATE POLICY community_owners_delete_admin ON community_owners
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- communities
-- ============================================================================

-- Visible to: the community's owner, admins, and brands that have either an
-- outstanding partnership_request or a campaign_application linking one of
-- their campaigns to this community.
DROP POLICY IF EXISTS communities_select_visible ON communities;
CREATE POLICY communities_select_visible ON communities
  FOR SELECT
  USING (
    owner_id = current_community_owner_id()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM partnership_requests pr
      JOIN campaigns c ON c.id = pr.campaign_id
      WHERE pr.community_id = communities.id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM campaign_applications ca
      JOIN campaigns c ON c.id = ca.campaign_id
      WHERE ca.community_id = communities.id
        AND c.brand_id = current_brand_id()
    )
  );

-- A community may only be created by its declared owner, or by an admin.
DROP POLICY IF EXISTS communities_insert_owner_or_admin ON communities;
CREATE POLICY communities_insert_owner_or_admin ON communities
  FOR INSERT
  WITH CHECK (
    owner_id = current_community_owner_id()
    OR is_admin(auth.uid())
  );

-- The owner can edit their own community; admins can edit any.
DROP POLICY IF EXISTS communities_update_owner_or_admin ON communities;
CREATE POLICY communities_update_owner_or_admin ON communities
  FOR UPDATE
  USING (owner_id = current_community_owner_id() OR is_admin(auth.uid()))
  WITH CHECK (owner_id = current_community_owner_id() OR is_admin(auth.uid()));

-- Only admins may hard-delete a community.
DROP POLICY IF EXISTS communities_delete_admin ON communities;
CREATE POLICY communities_delete_admin ON communities
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- campaigns
-- ============================================================================

-- Visible to: the owning brand, admins, and any community owner (for
-- discovery) — but only while the campaign is in an open-for-matching state.
DROP POLICY IF EXISTS campaigns_select_visible ON campaigns;
CREATE POLICY campaigns_select_visible ON campaigns
  FOR SELECT
  USING (
    brand_id = current_brand_id()
    OR is_admin(auth.uid())
    OR (
      status IN ('active', 'matching')
      AND current_community_owner_id() IS NOT NULL
    )
  );

-- Brands may create campaigns under their own brand_id; admins may create on anyone's behalf.
DROP POLICY IF EXISTS campaigns_insert_brand_or_admin ON campaigns;
CREATE POLICY campaigns_insert_brand_or_admin ON campaigns
  FOR INSERT
  WITH CHECK (
    brand_id = current_brand_id()
    OR is_admin(auth.uid())
  );

-- A brand may edit its own campaigns; admins may edit any.
DROP POLICY IF EXISTS campaigns_update_brand_or_admin ON campaigns;
CREATE POLICY campaigns_update_brand_or_admin ON campaigns
  FOR UPDATE
  USING (brand_id = current_brand_id() OR is_admin(auth.uid()))
  WITH CHECK (brand_id = current_brand_id() OR is_admin(auth.uid()));

-- Only admins may hard-delete a campaign.
DROP POLICY IF EXISTS campaigns_delete_admin ON campaigns;
CREATE POLICY campaigns_delete_admin ON campaigns
  FOR DELETE
  USING (is_admin(auth.uid()));
