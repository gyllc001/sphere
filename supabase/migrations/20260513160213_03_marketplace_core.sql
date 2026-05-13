-- Marketplace core: communities, campaigns, partnership_requests, deals,
-- campaign_applications, content_submissions. Ordering respects FK
-- dependencies within this file and back to the identity tables.

CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL REFERENCES community_owners(id),
  name varchar(255) NOT NULL,
  slug varchar(255) NOT NULL UNIQUE,
  description text,
  platform community_platform NOT NULL,
  platform_url text,
  niche varchar(100),
  member_count integer NOT NULL DEFAULT 0,
  engagement_rate varchar(20),
  audience_demographics text,
  base_rate integer,
  admin_discord_user_id text,
  admin_phone varchar(50),
  admin_facebook_page_id text,
  vertical varchar(50),
  content_topics text[] NOT NULL DEFAULT '{}',
  content_types_accepted text,
  topics_excluded text,
  -- Free-text on this table by historical decision; the verification_status
  -- pgEnum is used only by scraped_communities.
  verification_status varchar(20) NOT NULL DEFAULT 'unverified',
  status community_status NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  brand_id uuid NOT NULL REFERENCES brands(id),
  title varchar(255) NOT NULL,
  brief text NOT NULL,
  objectives text,
  target_audience text,
  niche varchar(100),
  min_community_size integer,
  budget_cents integer,
  status campaign_status NOT NULL DEFAULT 'draft',
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partnership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  community_id uuid NOT NULL REFERENCES communities(id),
  match_score integer,
  match_rationale text,
  proposed_rate_cents integer,
  message text,
  status partnership_request_status NOT NULL DEFAULT 'pending',
  -- 0 = brand-initiated, 1 = AI-initiated. Integer-as-boolean retained
  -- from the original schema to avoid breaking existing Drizzle reads.
  initiated_by_ai integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  partnership_request_id uuid NOT NULL REFERENCES partnership_requests(id),
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  community_id uuid NOT NULL REFERENCES communities(id),
  agreed_rate_cents integer NOT NULL,
  deliverables text,
  contract_url text,
  status deal_status NOT NULL DEFAULT 'negotiating',
  negotiation_log text,
  payment_status payment_status DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  paid_at timestamptz,
  payout_at timestamptz,
  signature_status signature_status NOT NULL DEFAULT 'unsigned',
  envelope_id text,
  signed_contract_url text,
  brand_signed_at timestamptz,
  community_signed_at timestamptz,
  signed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  community_id uuid NOT NULL REFERENCES communities(id),
  pitch text NOT NULL,
  proposed_rate_cents integer,
  status campaign_application_status NOT NULL DEFAULT 'pending',
  brand_note text,
  deal_id uuid REFERENCES deals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_applications_campaign_id_community_id_unique
    UNIQUE (campaign_id, community_id)
);

CREATE TABLE IF NOT EXISTS content_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  deal_id uuid NOT NULL REFERENCES deals(id),
  brief text NOT NULL,
  -- JSON array stored as text by historical decision; preserved to avoid
  -- breaking existing Drizzle reads. Convert to jsonb only if a query
  -- ever needs to filter into it.
  asset_urls text NOT NULL DEFAULT '[]',
  status content_submission_status NOT NULL DEFAULT 'pending_review',
  brand_approved integer NOT NULL DEFAULT 0,
  community_approved integer NOT NULL DEFAULT 0,
  changes_requested_note text,
  post_url text,
  posted_at timestamptz,
  confirmed_at timestamptz,
  payout_queued_at timestamptz,
  disputed_at timestamptz,
  dispute_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
