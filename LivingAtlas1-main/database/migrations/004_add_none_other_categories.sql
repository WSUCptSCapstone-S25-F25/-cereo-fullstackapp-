-- Migration 004: Add "None" and "Other" categories, make CategoryID nullable on Cards
-- Run against the living atlas database

-- 1. Insert new category rows
INSERT INTO Categories (CategoryID, CategoryLabel)
VALUES
    (4, 'None'),
    (5, 'Other')
ON CONFLICT (CategoryID) DO NOTHING;

-- 2. Allow NULL CategoryID on Cards (make category optional)
ALTER TABLE Cards ALTER COLUMN CategoryID DROP NOT NULL;
