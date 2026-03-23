-- Migration: Create CardImages table for multi-image support
-- Date: 2026-03-23
-- Purpose: Support multiple images per card while maintaining backward compatibility

-- Step 1: Create CardImages table
CREATE TABLE IF NOT EXISTS CardImages (
    ImageID SERIAL PRIMARY KEY,
    CardID INT NOT NULL,
    ImageURL VARCHAR(255) NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    AltText VARCHAR(255),
    DateAdded DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (CardID) REFERENCES Cards(CardID) ON DELETE CASCADE
);

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cardimages_cardid ON CardImages(CardID, DisplayOrder);

-- Step 3: Migrate existing Thumbnail_Link data to CardImages
-- This preserves all existing thumbnail data
INSERT INTO CardImages (CardID, ImageURL, DisplayOrder, AltText, DateAdded)
SELECT 
    c.CardID,
    c.Thumbnail_Link,
    0 AS DisplayOrder,
    c.Title AS AltText,
    CURRENT_DATE AS DateAdded
FROM Cards c
WHERE c.Thumbnail_Link IS NOT NULL 
  AND c.Thumbnail_Link != ''
  AND NOT EXISTS (
    SELECT 1 FROM CardImages ci WHERE ci.CardID = c.CardID
  );

-- Step 4: Verify migration count
SELECT COUNT(*) as migrated_images FROM CardImages;

-- Step 5: Mark completion (optional - for logging)
-- The Thumbnail_Link column in Cards table is kept for backward compatibility
-- New images should be added to CardImages table
-- Optional: In future, remove Thumbnail_Link after full transition
