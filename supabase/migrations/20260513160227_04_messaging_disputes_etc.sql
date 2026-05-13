-- Messaging, disputes, scraped communities, and deal feedback.
-- Polymorphic id columns (sender_id, opened_by_id, author_id,
-- deal_feedback.user_id) reference either brands.id or
-- community_owners.id depending on a sibling enum/role column,
-- so they are intentionally not FK-constrained. The access boundary
-- will be enforced by RLS in the Step 4 (CLAUDE.md) auth migration.

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL REFERENCES brands(id),
  community_owner_id uuid NOT NULL REFERENCES community_owners(id),
  deal_id uuid REFERENCES deals(id),
  subject varchar(255),
  status conversation_status NOT NULL DEFAULT 'open',
  brand_last_read_at timestamptz,
  owner_last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conv_brand_idx ON conversations (brand_id);
CREATE INDEX IF NOT EXISTS conv_owner_idx ON conversations (community_owner_id);
CREATE INDEX IF NOT EXISTS conv_deal_idx ON conversations (deal_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  sender_type message_sender_type NOT NULL,
  sender_id uuid,
  body text NOT NULL,
  -- Internal audit only; the PII service in apps/api/src/services/pii.ts
  -- ensures this is never returned by the public API.
  inbound_email_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS msg_conv_idx ON messages (conversation_id);

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  deal_id uuid NOT NULL REFERENCES deals(id),
  opened_by dispute_opened_by NOT NULL,
  opened_by_id uuid NOT NULL,
  reason text NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  resolved_by_admin_note text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dispute_deal_idx ON disputes (deal_id);
CREATE INDEX IF NOT EXISTS dispute_status_idx ON disputes (status);

CREATE TABLE IF NOT EXISTS dispute_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  dispute_id uuid NOT NULL REFERENCES disputes(id),
  -- 'brand' | 'community_owner' | 'admin' — kept as varchar because the
  -- admin value has no row in brands/community_owners.
  author_type varchar(30) NOT NULL,
  author_id uuid,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dcomment_dispute_idx ON dispute_comments (dispute_id);

CREATE TABLE IF NOT EXISTS scraped_communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name varchar(255) NOT NULL,
  platform varchar(50) NOT NULL,
  handle varchar(255),
  url text,
  member_count integer,
  estimated_engagement_rate varchar(20),
  description text,
  primary_language varchar(10),
  location varchar(100),
  niche_tags text[] NOT NULL DEFAULT '{}',
  admin_contact_email text,
  admin_contact_name varchar(255),
  admin_contact_handle varchar(255),
  raw_metadata text,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  scraped_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS scraped_communities_platform_handle_uniq
  ON scraped_communities (platform, handle);
CREATE INDEX IF NOT EXISTS scraped_communities_platform_idx
  ON scraped_communities (platform);
CREATE INDEX IF NOT EXISTS scraped_communities_verification_idx
  ON scraped_communities (verification_status);
CREATE INDEX IF NOT EXISTS scraped_communities_member_count_idx
  ON scraped_communities (member_count DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS deal_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  deal_id uuid NOT NULL REFERENCES deals(id),
  user_id uuid NOT NULL,
  user_role text NOT NULL,
  deal_quality integer NOT NULL,
  ease_of_use integer NOT NULL,
  repeat_intent repeat_intent NOT NULL,
  open_text text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deal_feedback_user_deal_uniq UNIQUE (deal_id, user_id)
);

CREATE INDEX IF NOT EXISTS deal_feedback_deal_id_idx ON deal_feedback (deal_id);
