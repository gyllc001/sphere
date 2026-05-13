-- Row-Level Security for deals, messaging, disputes, and admin tooling.
--
-- Second of two RLS migrations (07/08). Default-deny posture: enabling
-- RLS without an applicable policy blocks access. Trusted server code
-- (matching engine on partnership_requests, webhook handlers that mint
-- deals, scraper job populating scraped_communities, system messages)
-- uses the service_role key, which bypasses RLS — that is how rows that
-- have no end-user INSERT policy get created at all.
--
-- Naming convention: <table>_<verb>_<scope>.
-- All CREATE POLICY statements are preceded by DROP POLICY IF EXISTS so
-- this file is safe to re-run.

ALTER TABLE partnership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- partnership_requests
-- ============================================================================

-- Visible to the brand behind the campaign, the owner of the community, and admins.
DROP POLICY IF EXISTS partnership_requests_select_participants ON partnership_requests;
CREATE POLICY partnership_requests_select_participants ON partnership_requests
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = partnership_requests.campaign_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM communities cm
      WHERE cm.id = partnership_requests.community_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- End users do not create partnership_requests directly — the matching engine
-- writes them via service_role. Explicit admin-only policies exist so a
-- human admin can backfill or repair rows from the dashboard.
DROP POLICY IF EXISTS partnership_requests_insert_admin ON partnership_requests;
CREATE POLICY partnership_requests_insert_admin ON partnership_requests
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS partnership_requests_update_admin ON partnership_requests;
CREATE POLICY partnership_requests_update_admin ON partnership_requests
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS partnership_requests_delete_admin ON partnership_requests;
CREATE POLICY partnership_requests_delete_admin ON partnership_requests
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- campaign_applications
-- ============================================================================

-- Visible to the brand behind the campaign, the owner of the applying community, and admins.
DROP POLICY IF EXISTS campaign_applications_select_participants ON campaign_applications;
CREATE POLICY campaign_applications_select_participants ON campaign_applications
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_applications.campaign_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM communities cm
      WHERE cm.id = campaign_applications.community_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- A community owner may only apply on behalf of a community they own.
DROP POLICY IF EXISTS campaign_applications_insert_owner ON campaign_applications;
CREATE POLICY campaign_applications_insert_owner ON campaign_applications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities cm
      WHERE cm.id = campaign_applications.community_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- Either side (or admin) may update — e.g. brand accepts, owner withdraws.
DROP POLICY IF EXISTS campaign_applications_update_participants ON campaign_applications;
CREATE POLICY campaign_applications_update_participants ON campaign_applications
  FOR UPDATE
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_applications.campaign_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM communities cm
      WHERE cm.id = campaign_applications.community_id
        AND cm.owner_id = current_community_owner_id()
    )
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_applications.campaign_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM communities cm
      WHERE cm.id = campaign_applications.community_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- Only admins may hard-delete an application row.
DROP POLICY IF EXISTS campaign_applications_delete_admin ON campaign_applications;
CREATE POLICY campaign_applications_delete_admin ON campaign_applications
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- deals
-- ============================================================================

-- Visible to the brand behind the campaign, the owner of the community, and admins.
DROP POLICY IF EXISTS deals_select_participants ON deals;
CREATE POLICY deals_select_participants ON deals
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = deals.campaign_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM communities cm
      WHERE cm.id = deals.community_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- Deals are minted by service_role on partnership acceptance; admin-only manual creation.
DROP POLICY IF EXISTS deals_insert_admin ON deals;
CREATE POLICY deals_insert_admin ON deals
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Either side (or admin) may update — status, deliverables, signature columns, etc.
DROP POLICY IF EXISTS deals_update_participants ON deals;
CREATE POLICY deals_update_participants ON deals
  FOR UPDATE
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = deals.campaign_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM communities cm
      WHERE cm.id = deals.community_id
        AND cm.owner_id = current_community_owner_id()
    )
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = deals.campaign_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM communities cm
      WHERE cm.id = deals.community_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- Only admins may hard-delete a deal.
DROP POLICY IF EXISTS deals_delete_admin ON deals;
CREATE POLICY deals_delete_admin ON deals
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- content_submissions
-- ============================================================================

-- Visible to either party in the parent deal, plus admins.
DROP POLICY IF EXISTS content_submissions_select_participants ON content_submissions;
CREATE POLICY content_submissions_select_participants ON content_submissions
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM deals d
      JOIN campaigns c ON c.id = d.campaign_id
      WHERE d.id = content_submissions.deal_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM deals d
      JOIN communities cm ON cm.id = d.community_id
      WHERE d.id = content_submissions.deal_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- Only the community-owner side of the deal submits content for review.
DROP POLICY IF EXISTS content_submissions_insert_owner ON content_submissions;
CREATE POLICY content_submissions_insert_owner ON content_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals d
      JOIN communities cm ON cm.id = d.community_id
      WHERE d.id = content_submissions.deal_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- Both sides (and admins) update the submission row (approve, request changes, mark posted, etc.).
DROP POLICY IF EXISTS content_submissions_update_participants ON content_submissions;
CREATE POLICY content_submissions_update_participants ON content_submissions
  FOR UPDATE
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM deals d
      JOIN campaigns c ON c.id = d.campaign_id
      WHERE d.id = content_submissions.deal_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM deals d
      JOIN communities cm ON cm.id = d.community_id
      WHERE d.id = content_submissions.deal_id
        AND cm.owner_id = current_community_owner_id()
    )
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM deals d
      JOIN campaigns c ON c.id = d.campaign_id
      WHERE d.id = content_submissions.deal_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM deals d
      JOIN communities cm ON cm.id = d.community_id
      WHERE d.id = content_submissions.deal_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- Only admins may hard-delete a content submission.
DROP POLICY IF EXISTS content_submissions_delete_admin ON content_submissions;
CREATE POLICY content_submissions_delete_admin ON content_submissions
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- conversations
-- ============================================================================

-- A conversation is visible to its two participants and admins.
DROP POLICY IF EXISTS conversations_select_participants ON conversations;
CREATE POLICY conversations_select_participants ON conversations
  FOR SELECT
  USING (
    brand_id = current_brand_id()
    OR community_owner_id = current_community_owner_id()
    OR is_admin(auth.uid())
  );

-- New conversations must list the inserter as one of the two participants.
DROP POLICY IF EXISTS conversations_insert_participant ON conversations;
CREATE POLICY conversations_insert_participant ON conversations
  FOR INSERT
  WITH CHECK (
    brand_id = current_brand_id()
    OR community_owner_id = current_community_owner_id()
  );

-- Either participant (or admin) can update — e.g. read receipts, archive status.
DROP POLICY IF EXISTS conversations_update_participants ON conversations;
CREATE POLICY conversations_update_participants ON conversations
  FOR UPDATE
  USING (
    brand_id = current_brand_id()
    OR community_owner_id = current_community_owner_id()
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    brand_id = current_brand_id()
    OR community_owner_id = current_community_owner_id()
    OR is_admin(auth.uid())
  );

-- Only admins may hard-delete a conversation.
DROP POLICY IF EXISTS conversations_delete_admin ON conversations;
CREATE POLICY conversations_delete_admin ON conversations
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- messages
-- ============================================================================

-- A message is visible if you can see its parent conversation (admins always can).
DROP POLICY IF EXISTS messages_select_participants ON messages;
CREATE POLICY messages_select_participants ON messages
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.brand_id = current_brand_id()
          OR c.community_owner_id = current_community_owner_id()
        )
    )
  );

-- Sender must be a participant of the conversation AND sender_id must match
-- their identity. sender_type='system' is rejected at the policy level —
-- system messages can only be inserted by service_role, which bypasses RLS.
DROP POLICY IF EXISTS messages_insert_sender ON messages;
CREATE POLICY messages_insert_sender ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          (sender_type = 'brand'
            AND sender_id = current_brand_id()
            AND c.brand_id = current_brand_id())
          OR (sender_type = 'community_owner'
            AND sender_id = current_community_owner_id()
            AND c.community_owner_id = current_community_owner_id())
        )
    )
  );

-- Messages are immutable to end users once sent; only admins can mutate.
DROP POLICY IF EXISTS messages_update_admin ON messages;
CREATE POLICY messages_update_admin ON messages
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS messages_delete_admin ON messages;
CREATE POLICY messages_delete_admin ON messages
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- disputes
-- ============================================================================

-- Visible to deal participants and admins.
DROP POLICY IF EXISTS disputes_select_participants ON disputes;
CREATE POLICY disputes_select_participants ON disputes
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM deals d
      JOIN campaigns c ON c.id = d.campaign_id
      WHERE d.id = disputes.deal_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM deals d
      JOIN communities cm ON cm.id = d.community_id
      WHERE d.id = disputes.deal_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- A participant opens the dispute under their own identity: opened_by_id must
-- match current_brand_id() / current_community_owner_id() depending on the
-- opened_by enum, AND the opener must actually be on that side of the deal.
DROP POLICY IF EXISTS disputes_insert_participant ON disputes;
CREATE POLICY disputes_insert_participant ON disputes
  FOR INSERT
  WITH CHECK (
    (
      opened_by = 'brand'
      AND opened_by_id = current_brand_id()
      AND EXISTS (
        SELECT 1 FROM deals d
        JOIN campaigns c ON c.id = d.campaign_id
        WHERE d.id = disputes.deal_id
          AND c.brand_id = current_brand_id()
      )
    )
    OR (
      opened_by = 'community_owner'
      AND opened_by_id = current_community_owner_id()
      AND EXISTS (
        SELECT 1 FROM deals d
        JOIN communities cm ON cm.id = d.community_id
        WHERE d.id = disputes.deal_id
          AND cm.owner_id = current_community_owner_id()
      )
    )
  );

-- Disputes are resolved by admins; status / resolution-note updates are admin-only.
DROP POLICY IF EXISTS disputes_update_admin ON disputes;
CREATE POLICY disputes_update_admin ON disputes
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS disputes_delete_admin ON disputes;
CREATE POLICY disputes_delete_admin ON disputes
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- dispute_comments
-- ============================================================================

-- Same readers as the parent dispute: deal participants and admins.
DROP POLICY IF EXISTS dispute_comments_select_participants ON dispute_comments;
CREATE POLICY dispute_comments_select_participants ON dispute_comments
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM disputes dp
      JOIN deals d ON d.id = dp.deal_id
      JOIN campaigns c ON c.id = d.campaign_id
      WHERE dp.id = dispute_comments.dispute_id
        AND c.brand_id = current_brand_id()
    )
    OR EXISTS (
      SELECT 1 FROM disputes dp
      JOIN deals d ON d.id = dp.deal_id
      JOIN communities cm ON cm.id = d.community_id
      WHERE dp.id = dispute_comments.dispute_id
        AND cm.owner_id = current_community_owner_id()
    )
  );

-- A deal participant may comment under their own identity; admins may comment
-- with author_type='admin' (and author_id may be NULL — admins have no row
-- in brands/community_owners).
DROP POLICY IF EXISTS dispute_comments_insert_author ON dispute_comments;
CREATE POLICY dispute_comments_insert_author ON dispute_comments
  FOR INSERT
  WITH CHECK (
    (author_type = 'admin' AND is_admin(auth.uid()))
    OR (
      author_type = 'brand'
      AND author_id = current_brand_id()
      AND EXISTS (
        SELECT 1 FROM disputes dp
        JOIN deals d ON d.id = dp.deal_id
        JOIN campaigns c ON c.id = d.campaign_id
        WHERE dp.id = dispute_comments.dispute_id
          AND c.brand_id = current_brand_id()
      )
    )
    OR (
      author_type = 'community_owner'
      AND author_id = current_community_owner_id()
      AND EXISTS (
        SELECT 1 FROM disputes dp
        JOIN deals d ON d.id = dp.deal_id
        JOIN communities cm ON cm.id = d.community_id
        WHERE dp.id = dispute_comments.dispute_id
          AND cm.owner_id = current_community_owner_id()
      )
    )
  );

-- Dispute comments are immutable to end users; admins may edit / delete.
DROP POLICY IF EXISTS dispute_comments_update_admin ON dispute_comments;
CREATE POLICY dispute_comments_update_admin ON dispute_comments
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS dispute_comments_delete_admin ON dispute_comments;
CREATE POLICY dispute_comments_delete_admin ON dispute_comments
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- scraped_communities
-- ============================================================================

-- Internal admin tool — no end-user access for any verb.
DROP POLICY IF EXISTS scraped_communities_select_admin ON scraped_communities;
CREATE POLICY scraped_communities_select_admin ON scraped_communities
  FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS scraped_communities_insert_admin ON scraped_communities;
CREATE POLICY scraped_communities_insert_admin ON scraped_communities
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS scraped_communities_update_admin ON scraped_communities;
CREATE POLICY scraped_communities_update_admin ON scraped_communities
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS scraped_communities_delete_admin ON scraped_communities;
CREATE POLICY scraped_communities_delete_admin ON scraped_communities
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- deal_feedback
-- ============================================================================

-- Authors can read their own submitted feedback; admins can read all.
DROP POLICY IF EXISTS deal_feedback_select_self_or_admin ON deal_feedback;
CREATE POLICY deal_feedback_select_self_or_admin ON deal_feedback
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR user_id = current_brand_id()
    OR user_id = current_community_owner_id()
  );

-- Feedback must be submitted under the user's own identity, and only for a deal the user participated in.
DROP POLICY IF EXISTS deal_feedback_insert_self ON deal_feedback;
CREATE POLICY deal_feedback_insert_self ON deal_feedback
  FOR INSERT
  WITH CHECK (
    (
      user_id = current_brand_id()
      AND EXISTS (
        SELECT 1 FROM deals d
        JOIN campaigns c ON c.id = d.campaign_id
        WHERE d.id = deal_feedback.deal_id
          AND c.brand_id = current_brand_id()
      )
    )
    OR (
      user_id = current_community_owner_id()
      AND EXISTS (
        SELECT 1 FROM deals d
        JOIN communities cm ON cm.id = d.community_id
        WHERE d.id = deal_feedback.deal_id
          AND cm.owner_id = current_community_owner_id()
      )
    )
  );

-- Feedback is immutable to end users; admins may correct / remove.
DROP POLICY IF EXISTS deal_feedback_update_admin ON deal_feedback;
CREATE POLICY deal_feedback_update_admin ON deal_feedback
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS deal_feedback_delete_admin ON deal_feedback;
CREATE POLICY deal_feedback_delete_admin ON deal_feedback
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- admins
-- ============================================================================

-- Any admin can see the admin roster.
DROP POLICY IF EXISTS admins_select_admin ON admins;
CREATE POLICY admins_select_admin ON admins
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only super_admins may add / edit / remove admin entries.
DROP POLICY IF EXISTS admins_insert_super_admin ON admins;
CREATE POLICY admins_insert_super_admin ON admins
  FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS admins_update_super_admin ON admins;
CREATE POLICY admins_update_super_admin ON admins
  FOR UPDATE
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS admins_delete_super_admin ON admins;
CREATE POLICY admins_delete_super_admin ON admins
  FOR DELETE
  USING (is_super_admin(auth.uid()));
