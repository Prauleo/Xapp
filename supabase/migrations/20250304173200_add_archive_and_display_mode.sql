-- Add is_archived and display_mode columns to narrative_episodes table
ALTER TABLE narrative_episodes ADD COLUMN is_archived BOOLEAN DEFAULT false;
ALTER TABLE narrative_episodes ADD COLUMN display_mode TEXT DEFAULT 'compact' CHECK (display_mode IN ('compact', 'detailed'));
