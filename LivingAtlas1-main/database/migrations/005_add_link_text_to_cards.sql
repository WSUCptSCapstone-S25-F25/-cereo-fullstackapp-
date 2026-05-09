-- Migration: Add LinkText column to Cards for custom link display text
-- Date: 2026-04-25
-- Purpose: Allow cards to show a custom display label for their link URL

ALTER TABLE Cards ADD COLUMN IF NOT EXISTS LinkText VARCHAR(255);
