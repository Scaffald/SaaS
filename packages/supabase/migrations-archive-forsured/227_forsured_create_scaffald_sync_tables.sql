-- Migration: create_scaffald_sync_tables.sql

-- Track synced entities
CREATE TABLE forsured.scaffald_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'company', 'project', 'user'
  forsured_id UUID NOT NULL,
  scaffald_id UUID NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status VARCHAR(20) DEFAULT 'synced', -- 'synced', 'pending', 'error'
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, forsured_id),
  UNIQUE(entity_type, scaffald_id)
);

-- Sync audit log
CREATE TABLE forsured.scaffald_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID REFERENCES forsured.scaffald_sync(id),
  direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
  action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
  entity_data JSONB,
  result VARCHAR(20) NOT NULL, -- 'success', 'error', 'skipped'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
