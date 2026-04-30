-- Add theme column to users table for personalized UI settings
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'classic';

-- Update existing users to have the 'classic' theme if they don't have one
UPDATE users 
SET theme = 'classic' 
WHERE theme IS NULL;
