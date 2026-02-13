#!/bin/bash
# Quick script to apply just the inbound email migration to production

echo "Applying inbound email settings migration to production..."

# Get database password from .env.production
DB_URL="postgresql://postgres:8xmbGpzwoQT5pvIl@db.qmfmpcyxsihhfttvqpbw.supabase.co:5432/postgres"

# Apply the migration
psql "$DB_URL" -f packages/supabase/migrations/302_forsured_inbound_email_settings.sql

echo "Migration applied! Verifying..."

# Verify the setting was created
psql "$DB_URL" -c "SELECT * FROM forsured.app_settings WHERE key = 'inbound_email_base_domain';"

echo "Done!"
