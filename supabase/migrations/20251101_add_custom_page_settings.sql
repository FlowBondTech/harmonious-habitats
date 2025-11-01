-- Migration: Add custom page settings for white-label pages
-- Date: 2025-11-01
-- Description: Adds custom_page_settings JSONB column to spaces and profiles tables
--              to enable white-label custom branded pages for spaces and facilitators

-- Add custom_page_settings to spaces table
ALTER TABLE spaces
ADD COLUMN IF NOT EXISTS custom_page_settings JSONB DEFAULT '{
  "enabled": false,
  "template": "minimal",
  "branding": {
    "primaryColor": "#1a3d2e",
    "accentColor": "#87a96b",
    "logoUrl": null,
    "bannerUrl": null
  },
  "customBlocks": [],
  "seo": {
    "metaTitle": "",
    "metaDescription": ""
  },
  "socialLinks": {}
}'::jsonb;

-- Add custom_page_settings to profiles table (for facilitators)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS custom_page_settings JSONB DEFAULT '{
  "enabled": false,
  "template": "minimal",
  "branding": {
    "primaryColor": "#1a3d2e",
    "accentColor": "#87a96b",
    "logoUrl": null,
    "bannerUrl": null
  },
  "customBlocks": [],
  "seo": {
    "metaTitle": "",
    "metaDescription": ""
  },
  "socialLinks": {}
}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN spaces.custom_page_settings IS 'White-label custom page configuration including template, branding, custom blocks, and SEO settings';
COMMENT ON COLUMN profiles.custom_page_settings IS 'White-label custom page configuration for facilitator pages including template, branding, custom blocks, and SEO settings';

-- Create index for faster queries on enabled custom pages
CREATE INDEX IF NOT EXISTS idx_spaces_custom_page_enabled
ON spaces ((custom_page_settings->>'enabled'))
WHERE (custom_page_settings->>'enabled')::boolean = true;

CREATE INDEX IF NOT EXISTS idx_profiles_custom_page_enabled
ON profiles ((custom_page_settings->>'enabled'))
WHERE (custom_page_settings->>'enabled')::boolean = true;
