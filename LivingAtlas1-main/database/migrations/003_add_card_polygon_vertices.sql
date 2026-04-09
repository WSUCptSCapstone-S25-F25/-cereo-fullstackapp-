-- Migration: Add CardPolygonVertices table for polygon-based card locations
-- Date: 2026-04-09
-- Purpose: Allow cards to be represented by polygon areas instead of single points

-- Step 1: Add location_type column to Cards (default 'point' for backward compat)
ALTER TABLE Cards ADD COLUMN IF NOT EXISTS LocationType VARCHAR(10) DEFAULT 'point';

-- Step 2: Make Latitude and Longitude nullable (polygon cards compute centroid instead)
ALTER TABLE Cards ALTER COLUMN Latitude DROP NOT NULL;
ALTER TABLE Cards ALTER COLUMN Longitude DROP NOT NULL;

-- Step 3: Create CardPolygonVertices table
CREATE TABLE IF NOT EXISTS CardPolygonVertices (
    VertexID SERIAL PRIMARY KEY,
    CardID INT NOT NULL,
    VertexOrder INT NOT NULL,
    Latitude DECIMAL(10,8) NOT NULL,
    Longitude DECIMAL(11,8) NOT NULL,
    FOREIGN KEY (CardID) REFERENCES Cards(CardID) ON DELETE CASCADE
);

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_card_polygon_cardid ON CardPolygonVertices(CardID, VertexOrder);
