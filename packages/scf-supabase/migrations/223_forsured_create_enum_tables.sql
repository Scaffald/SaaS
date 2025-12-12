-- Migration: create_enum_tables.sql
CREATE TABLE forsured.enum_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enum_type VARCHAR(50) NOT NULL,
  value VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enum_type, value)
);
