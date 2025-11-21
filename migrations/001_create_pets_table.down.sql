-- Rollback Migration: 001_create_pets_table
-- Description: Drop pets table and related objects
-- Date: 2025-11-22

-- Drop trigger
DROP TRIGGER IF EXISTS update_pets_updated_at ON pets;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes (automatically dropped with table, but explicit for clarity)
DROP INDEX IF EXISTS idx_pets_species;
DROP INDEX IF EXISTS idx_pets_breed;
DROP INDEX IF EXISTS idx_pets_status;
DROP INDEX IF EXISTS idx_pets_owner_id;
DROP INDEX IF EXISTS idx_pets_created_at;
DROP INDEX IF EXISTS idx_pets_age_total_months;
DROP INDEX IF EXISTS idx_pets_gender;
DROP INDEX IF EXISTS idx_pets_size;
DROP INDEX IF EXISTS idx_pets_species_status;
DROP INDEX IF EXISTS idx_pets_species_breed;
DROP INDEX IF EXISTS idx_pets_personality;

-- Drop table
DROP TABLE IF EXISTS pets;
