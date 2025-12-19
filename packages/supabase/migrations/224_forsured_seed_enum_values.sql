-- Migration: seed_enum_values.sql

-- Generic enum table structure
-- NOTE: This table was created in 024_create_enum_tables.sql
-- CREATE TABLE forsured.enum_values (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   enum_type VARCHAR(50) NOT NULL,
--   value VARCHAR(100) NOT NULL,
--   display_name VARCHAR(100) NOT NULL,
--   description TEXT,
--   sort_order INTEGER DEFAULT 0,
--   is_active BOOLEAN DEFAULT TRUE,
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(enum_type, value)
-- );

-- Create index for fast lookups (These were also added in 024_create_enum_tables.sql)
-- CREATE INDEX idx_enum_values_type ON forsured.enum_values(enum_type);
-- CREATE INDEX idx_enum_values_active ON forsured.enum_values(enum_type, is_active);

-- Seed task statuses
INSERT INTO forsured.enum_values (enum_type, value, display_name, sort_order) VALUES
  ('task_status', 'pending', 'Pending', 1),
  ('task_status', 'in_progress', 'In Progress', 2),
  ('task_status', 'completed', 'Completed', 3),
  ('task_status', 'cancelled', 'Cancelled', 4);

-- Seed task priorities
INSERT INTO forsured.enum_values (enum_type, value, display_name, sort_order) VALUES
  ('task_priority', 'low', 'Low', 1),
  ('task_priority', 'medium', 'Medium', 2),
  ('task_priority', 'high', 'High', 3),
  ('task_priority', 'urgent', 'Urgent', 4);

-- Seed document statuses
INSERT INTO forsured.enum_values (enum_type, value, display_name, sort_order) VALUES
  ('document_status', 'pending', 'Pending Review', 1),
  ('document_status', 'approved', 'Approved', 2),
  ('document_status', 'rejected', 'Rejected', 3),
  ('document_status', 'expired', 'Expired', 4);

-- Seed policy types
INSERT INTO forsured.enum_values (enum_type, value, display_name, sort_order) VALUES
  ('policy_type', 'general_liability', 'General Liability', 1),
  ('policy_type', 'workers_comp', 'Workers Compensation', 2),
  ('policy_type', 'commercial_auto', 'Commercial Auto', 3),
  ('policy_type', 'umbrella_excess', 'Umbrella/Excess', 4),
  ('policy_type', 'professional_liability', 'Professional Liability', 5),
  ('policy_type', 'pollution_liability', 'Pollution Liability', 6),
  ('policy_type', 'builders_risk', 'Builders Risk', 7),
  ('policy_type', 'equipment_floater', 'Equipment Floater', 8);

-- Seed compliance statuses
INSERT INTO forsured.enum_values (enum_type, value, display_name, sort_order, metadata) VALUES
  ('compliance_status', 'compliant', 'Compliant', 1, '{"color": "green"}'),
  ('compliance_status', 'warning', 'Warning', 2, '{"color": "yellow"}'),
  ('compliance_status', 'critical', 'Critical', 3, '{"color": "red"}'),
  ('compliance_status', 'non_compliant', 'Non-Compliant', 4, '{"color": "red"}'),
  ('compliance_status', 'partial', 'Partial', 5, '{"color": "orange"}');

-- Seed trade types
INSERT INTO forsured.enum_values (enum_type, value, display_name, sort_order) VALUES
  ('trade_type', 'electrical', 'Electrical', 1),
  ('trade_type', 'plumbing', 'Plumbing', 2),
  ('trade_type', 'hvac', 'HVAC', 3),
  ('trade_type', 'roofing', 'Roofing', 4),
  ('trade_type', 'concrete', 'Concrete', 5),
  ('trade_type', 'framing', 'Framing', 6),
  ('trade_type', 'drywall', 'Drywall', 7),
  ('trade_type', 'painting', 'Painting', 8),
  ('trade_type', 'flooring', 'Flooring', 9),
  ('trade_type', 'landscaping', 'Landscaping', 10),
  ('trade_type', 'general', 'General', 11),
  ('trade_type', 'other', 'Other', 99);
