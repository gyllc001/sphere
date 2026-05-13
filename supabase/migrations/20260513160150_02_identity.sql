-- Identity tables: brands and community_owners.
-- Password hashes and email/password-reset token columns from the
-- pre-Supabase schema are intentionally absent — Supabase Auth
-- (auth.users) owns all credential storage. The nullable user_id
-- column links each row to the corresponding auth.users row; it
-- will be backfilled and set NOT NULL in the Step 3 auth migration.

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  slug varchar(255) NOT NULL UNIQUE,
  website text,
  logo text,
  description text,
  industry varchar(100),
  status brand_status NOT NULL DEFAULT 'active',
  email varchar(255) NOT NULL UNIQUE,
  brand_safety_categories text[] NOT NULL DEFAULT '{}',
  brand_safety_keywords text[] NOT NULL DEFAULT '{}',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_tier subscription_tier,
  subscription_status varchar(50),
  partnership_limit integer NOT NULL DEFAULT 0,
  tos_accepted_at timestamptz,
  tos_version varchar(50),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  status community_owner_status NOT NULL DEFAULT 'active',
  wallet_balance_cents integer NOT NULL DEFAULT 0,
  tos_accepted_at timestamptz,
  tos_version varchar(50),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
