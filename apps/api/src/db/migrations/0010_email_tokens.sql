-- Email verification and password reset token columns for brands
ALTER TABLE "brands"
  ADD COLUMN "email_verified_at" timestamp,
  ADD COLUMN "email_verification_token" text,
  ADD COLUMN "email_verification_token_expires_at" timestamp,
  ADD COLUMN "password_reset_token" text,
  ADD COLUMN "password_reset_token_expires_at" timestamp;

-- Email verification and password reset token columns for community_owners
ALTER TABLE "community_owners"
  ADD COLUMN "email_verified_at" timestamp,
  ADD COLUMN "email_verification_token" text,
  ADD COLUMN "email_verification_token_expires_at" timestamp,
  ADD COLUMN "password_reset_token" text,
  ADD COLUMN "password_reset_token_expires_at" timestamp;
