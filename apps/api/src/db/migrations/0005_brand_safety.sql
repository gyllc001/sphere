-- Brand safety: excluded topic categories and free-text keywords per brand
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_safety_categories text[] DEFAULT '{}' NOT NULL;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_safety_keywords text[] DEFAULT '{}' NOT NULL;

-- Community content topics: self-declared topic/content categories
ALTER TABLE communities ADD COLUMN IF NOT EXISTS content_topics text[] DEFAULT '{}' NOT NULL;
