-- Migration: 001_create_pets_table
-- Description: Create pets table with full pet information
-- Date: 2025-11-22

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(255),

    -- Age information (denormalized for performance)
    age_years INTEGER NOT NULL DEFAULT 0,
    age_months INTEGER NOT NULL DEFAULT 0,
    age_total_months INTEGER NOT NULL DEFAULT 0,
    age_is_estimated BOOLEAN NOT NULL DEFAULT false,
    age_text VARCHAR(100),

    gender VARCHAR(20),
    size VARCHAR(50),
    color VARCHAR(100),
    personality TEXT[], -- Array of personality traits

    -- Medical information (JSONB for flexibility)
    medical_info JSONB NOT NULL DEFAULT '{}',

    owner_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    location VARCHAR(255), -- "lat,lng" format
    images TEXT[], -- Array of image URLs
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT pets_species_check CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'other')),
    CONSTRAINT pets_gender_check CHECK (gender IN ('male', 'female', 'unknown')),
    CONSTRAINT pets_size_check CHECK (size IN ('small', 'medium', 'large', 'extra_large')),
    CONSTRAINT pets_status_check CHECK (status IN ('available', 'pending', 'adopted', 'unavailable')),
    CONSTRAINT pets_age_months_check CHECK (age_months >= 0 AND age_months <= 11)
);

-- Create indexes for common queries
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_breed ON pets(breed);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_pets_created_at ON pets(created_at DESC);
CREATE INDEX idx_pets_age_total_months ON pets(age_total_months);
CREATE INDEX idx_pets_gender ON pets(gender);
CREATE INDEX idx_pets_size ON pets(size);

-- Create composite index for common searches
CREATE INDEX idx_pets_species_status ON pets(species, status);
CREATE INDEX idx_pets_species_breed ON pets(species, breed);

-- Create GIN index for array fields (personality search)
CREATE INDEX idx_pets_personality ON pets USING GIN(personality);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pets_updated_at
    BEFORE UPDATE ON pets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE pets IS 'Pet information table - primary data store';
COMMENT ON COLUMN pets.age_total_months IS 'Computed total age in months for efficient range queries';
COMMENT ON COLUMN pets.medical_info IS 'JSONB: {vaccinated, neutered, health_issues[], last_checkup, medications[]}';
COMMENT ON COLUMN pets.location IS 'Format: "latitude,longitude"';
