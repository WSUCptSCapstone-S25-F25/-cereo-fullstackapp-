-- Create ArcGIS services table for Living Atlas Backend
-- This table stores ArcGIS service information fetched from various state endpoints

CREATE TABLE IF NOT EXISTS arcgis_services (
    id SERIAL PRIMARY KEY,
    service_key VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    folder VARCHAR(255) DEFAULT 'Root',
    type VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Create unique constraint to prevent duplicates
    CONSTRAINT unique_service_per_state UNIQUE (service_key, state, type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_arcgis_services_state ON arcgis_services(state);
CREATE INDEX IF NOT EXISTS idx_arcgis_services_type ON arcgis_services(type);
CREATE INDEX IF NOT EXISTS idx_arcgis_services_folder ON arcgis_services(folder);
CREATE INDEX IF NOT EXISTS idx_arcgis_services_state_type ON arcgis_services(state, type);

-- Add comments for documentation
COMMENT ON TABLE arcgis_services IS 'Stores ArcGIS service metadata for Washington, Idaho, and Oregon states';
COMMENT ON COLUMN arcgis_services.service_key IS 'Unique identifier key for the service (e.g., ADS_eim_mc_MapServer)';
COMMENT ON COLUMN arcgis_services.label IS 'Human-readable label for the service (e.g., eim_mc (MapServer))';
COMMENT ON COLUMN arcgis_services.url IS 'Full URL to the ArcGIS service endpoint';
COMMENT ON COLUMN arcgis_services.folder IS 'Folder/category where the service is organized';
COMMENT ON COLUMN arcgis_services.type IS 'Type of ArcGIS service (e.g., MapServer, FeatureServer)';
COMMENT ON COLUMN arcgis_services.state IS 'State name (washington, idaho, oregon)';