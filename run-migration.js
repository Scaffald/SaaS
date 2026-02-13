#!/usr/bin/env node
/**
 * Script to apply migration 302 to production database
 */

const fs = require('fs');
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:8xmbGpzwoQT5pvIl@db.qmfmpcyxsihhfttvqpbw.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected');

    // Read the migration file
    const sql = fs.readFileSync(
      './packages/supabase/migrations/302_forsured_inbound_email_settings.sql',
      'utf8'
    );

    console.log('\nApplying migration 302_forsured_inbound_email_settings.sql...');
    const result = await client.query(sql);

    console.log('\n✓ Migration applied successfully!');

    // Verify the setting was created
    console.log('\nVerifying setting...');
    const verifyResult = await client.query(`
      SELECT * FROM forsured.app_settings WHERE key = 'inbound_email_base_domain'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✓ Setting verified:');
      console.log(verifyResult.rows[0]);
    } else {
      console.log('⚠ Warning: Setting not found in database');
    }

    // Test the helper function
    console.log('\nTesting helper function...');
    const funcResult = await client.query(`
      SELECT forsured.get_setting('inbound_email_base_domain') as value
    `);
    console.log('✓ Helper function returns:', funcResult.rows[0].value);

  } catch (error) {
    console.error('\n✗ Error applying migration:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Disconnected from database');
  }
}

runMigration();
