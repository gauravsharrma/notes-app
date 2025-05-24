-- Modify title column to VARCHAR(200) if it's not already
DO $$ 
BEGIN 
    ALTER TABLE notes 
        ALTER COLUMN title TYPE VARCHAR(200);
EXCEPTION 
    WHEN others THEN NULL;
END $$;

-- Ensure content column is TEXT (it should be by default, but let's make sure)
DO $$ 
BEGIN 
    ALTER TABLE notes 
        ALTER COLUMN content TYPE TEXT;
EXCEPTION 
    WHEN others THEN NULL;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes (updated_at DESC);

-- Add comment to the table for documentation
COMMENT ON TABLE notes IS 'Stores notes with markdown content up to 1GB and searchable tags'; 