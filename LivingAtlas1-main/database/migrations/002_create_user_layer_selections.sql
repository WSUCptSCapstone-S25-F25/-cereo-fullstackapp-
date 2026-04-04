-- Migration: Create user_layer_selections table
-- Date: 2026-04-04
-- Purpose: Persist user's checked layers/sublayers across sessions

CREATE TABLE IF NOT EXISTS user_layer_selections (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    data_source VARCHAR(20) NOT NULL DEFAULT 'database',
    selections JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_state_source UNIQUE (user_email, state_code, data_source)
);

CREATE INDEX IF NOT EXISTS idx_user_layer_sel_email ON user_layer_selections(user_email);
