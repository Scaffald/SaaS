-- Migration: add_scaffald_company_id_to_companies.sql
-- NOTE: companies are managed in core.organizations schema
-- This column tracks the external Scaffald API company ID for syncing
ALTER TABLE core.organizations
ADD COLUMN IF NOT EXISTS scaffald_company_id UUID UNIQUE;
