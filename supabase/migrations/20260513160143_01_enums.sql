-- Extensions and pgEnums for the Sphere schema.
-- All enum types are created up front so subsequent migrations have
-- no cross-file type dependencies.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE brand_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('starter', 'growth', 'scale');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE community_owner_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE community_platform AS ENUM (
    'discord', 'slack', 'telegram', 'whatsapp', 'facebook_group',
    'reddit', 'circle', 'mighty_networks', 'newsletter', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE community_status AS ENUM ('active', 'inactive', 'pending_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM (
    'draft', 'active', 'matching', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE partnership_request_status AS ENUM (
    'pending', 'accepted', 'rejected', 'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deal_status AS ENUM (
    'negotiating', 'agreed', 'contract_sent', 'signed',
    'active', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'escrowed', 'released', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE signature_status AS ENUM (
    'unsigned', 'brand_signed', 'community_signed', 'fully_executed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_application_status AS ENUM (
    'pending', 'accepted', 'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_submission_status AS ENUM (
    'draft', 'pending_review', 'changes_requested', 'approved',
    'posted', 'confirmed', 'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_sender_type AS ENUM ('brand', 'community_owner', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM (
    'open', 'under_review', 'resolved_for_brand',
    'resolved_for_community', 'resolved_mutual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE dispute_opened_by AS ENUM ('brand', 'community_owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE repeat_intent AS ENUM ('yes', 'no', 'maybe');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
