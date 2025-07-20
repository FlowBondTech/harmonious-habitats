-- Add slug column to spaces table for URL-friendly names
ALTER TABLE spaces ADD COLUMN slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX idx_spaces_slug ON spaces(slug);

-- Add constraint to ensure slug format (lowercase alphanumeric with hyphens)
ALTER TABLE spaces ADD CONSTRAINT slug_format_check 
  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Create a function to generate a unique slug from space name
CREATE OR REPLACE FUNCTION generate_space_slug(name TEXT, owner_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase and replace spaces with hyphens
  base_slug := lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  -- If slug is empty after cleaning, use a default
  IF base_slug = '' THEN
    base_slug := 'space';
  END IF;
  
  -- Start with the base slug
  final_slug := base_slug;
  
  -- Check if slug exists and append number if needed
  WHILE EXISTS (SELECT 1 FROM spaces WHERE slug = final_slug AND owner_id != generate_space_slug.owner_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate slug on insert/update
CREATE OR REPLACE FUNCTION set_space_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's not provided or if name changed
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
    NEW.slug := generate_space_slug(NEW.name, NEW.owner_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_space_slug
  BEFORE INSERT OR UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION set_space_slug();

-- Update existing spaces with slugs
UPDATE spaces 
SET slug = generate_space_slug(name, owner_id)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE spaces ALTER COLUMN slug SET NOT NULL;

-- Add function to get space by slug
CREATE OR REPLACE FUNCTION get_space_by_slug(space_slug TEXT)
RETURNS SETOF spaces AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM spaces WHERE slug = space_slug;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN spaces.slug IS 'URL-friendly unique identifier for the space';