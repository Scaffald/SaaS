-- =========================================================
-- 085_onet_schema.sql
-- Extracted schema from 084_import_onet_full_data.sql
-- Sets up all O*NET reference tables without loading data
-- =========================================================

BEGIN;
CREATE SCHEMA IF NOT EXISTS onet;
CREATE TABLE IF NOT EXISTS onet.content_model_reference (
  element_id VARCHAR(20) NOT NULL,
  element_name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (element_id)
);
CREATE TABLE IF NOT EXISTS onet.scales_reference (
  scale_id VARCHAR(3) NOT NULL,
  scale_name VARCHAR(50) NOT NULL,
  minimum DECIMAL(1,0) NOT NULL,
  maximum DECIMAL(3,0) NOT NULL,
  PRIMARY KEY (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.occupation_data (
  onetsoc_code CHAR(10) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (onetsoc_code)
);
CREATE TABLE IF NOT EXISTS onet.iwa_reference (
  element_id VARCHAR(20) NOT NULL,
  iwa_id VARCHAR(20) NOT NULL,
  iwa_title VARCHAR(150) NOT NULL,
  PRIMARY KEY (iwa_id),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id)
);
CREATE TABLE IF NOT EXISTS onet.dwa_reference (
  element_id VARCHAR(20) NOT NULL,
  iwa_id VARCHAR(20) NOT NULL,
  dwa_id VARCHAR(20) NOT NULL,
  dwa_title VARCHAR(150) NOT NULL,
  PRIMARY KEY (dwa_id),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (iwa_id) REFERENCES onet.iwa_reference (iwa_id)
);
CREATE TABLE IF NOT EXISTS onet.job_zone_reference (
  job_zone DECIMAL(1,0) NOT NULL,
  name VARCHAR(50) NOT NULL,
  experience TEXT NOT NULL,
  education TEXT NOT NULL,
  job_training TEXT NOT NULL,
  examples TEXT NOT NULL,
  svp_range VARCHAR(25) NOT NULL,
  PRIMARY KEY (job_zone)
);
CREATE TABLE IF NOT EXISTS onet.job_zones (
  onetsoc_code CHAR(10) NOT NULL,
  job_zone DECIMAL(1,0) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (job_zone) REFERENCES onet.job_zone_reference (job_zone)
);
CREATE TABLE IF NOT EXISTS onet.abilities (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.skills (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.knowledge (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.work_activities (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.interests (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.work_styles (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.work_values (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.education_training_experience (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0),
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id),
  FOREIGN KEY (element_id, scale_id, category) REFERENCES onet.ete_categories (element_id, scale_id, category)
);
CREATE TABLE IF NOT EXISTS onet.ete_categories (
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0) NOT NULL,
  category_description TEXT NOT NULL,
  PRIMARY KEY (element_id, scale_id, category),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.work_context_categories (
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0) NOT NULL,
  category_description TEXT NOT NULL,
  PRIMARY KEY (element_id, scale_id, category),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.work_context (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0),
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id),
  FOREIGN KEY (element_id, scale_id, category) REFERENCES onet.work_context_categories (element_id, scale_id, category)
);
CREATE TABLE IF NOT EXISTS onet.task_categories (
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0) NOT NULL,
  category_description TEXT NOT NULL,
  PRIMARY KEY (scale_id, category),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id)
);
CREATE TABLE IF NOT EXISTS onet.task_statements (
  onetsoc_code CHAR(10) NOT NULL,
  task_id DECIMAL(8,0) NOT NULL,
  task TEXT NOT NULL,
  task_type VARCHAR(12),
  incumbents_responding DECIMAL(4,0),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  PRIMARY KEY (task_id),
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code)
);
CREATE TABLE IF NOT EXISTS onet.task_ratings (
  onetsoc_code CHAR(10) NOT NULL,
  task_id DECIMAL(8,0) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0),
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (task_id) REFERENCES onet.task_statements (task_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id),
  FOREIGN KEY (scale_id, category) REFERENCES onet.task_categories (scale_id, category)
);
CREATE TABLE IF NOT EXISTS onet.tasks_to_dwas (
  onetsoc_code CHAR(10) NOT NULL,
  task_id DECIMAL(8,0) NOT NULL,
  dwa_id VARCHAR(20) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (task_id) REFERENCES onet.task_statements (task_id),
  FOREIGN KEY (dwa_id) REFERENCES onet.dwa_reference (dwa_id)
);
CREATE TABLE IF NOT EXISTS onet.unspsc_reference (
  commodity_code DECIMAL(8,0) NOT NULL,
  commodity_title VARCHAR(150) NOT NULL,
  class_code DECIMAL(8,0) NOT NULL,
  class_title VARCHAR(150) NOT NULL,
  family_code DECIMAL(8,0) NOT NULL,
  family_title VARCHAR(150) NOT NULL,
  segment_code DECIMAL(8,0) NOT NULL,
  segment_title VARCHAR(150) NOT NULL,
  PRIMARY KEY (commodity_code)
);
CREATE TABLE IF NOT EXISTS onet.tools_used (
  onetsoc_code CHAR(10) NOT NULL,
  example VARCHAR(150) NOT NULL,
  commodity_code DECIMAL(8,0) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (commodity_code) REFERENCES onet.unspsc_reference (commodity_code)
);
CREATE TABLE IF NOT EXISTS onet.technology_skills (
  onetsoc_code CHAR(10) NOT NULL,
  example VARCHAR(150) NOT NULL,
  commodity_code DECIMAL(8,0) NOT NULL,
  hot_technology CHAR(1) NOT NULL,
  in_demand CHAR(1) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (commodity_code) REFERENCES onet.unspsc_reference (commodity_code)
);
CREATE TABLE IF NOT EXISTS onet.alternate_titles (
  onetsoc_code CHAR(10) NOT NULL,
  alternate_title VARCHAR(250) NOT NULL,
  short_title VARCHAR(150),
  sources VARCHAR(50) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code)
);
CREATE TABLE IF NOT EXISTS onet.sample_of_reported_titles (
  onetsoc_code CHAR(10) NOT NULL,
  reported_job_title VARCHAR(150) NOT NULL,
  shown_in_my_next_move CHAR(1) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code)
);
CREATE TABLE IF NOT EXISTS onet.occupation_level_metadata (
  onetsoc_code CHAR(10) NOT NULL,
  item VARCHAR(150) NOT NULL,
  response VARCHAR(75),
  n DECIMAL(4,0),
  percent DECIMAL(4,1),
  date_updated DATE NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code)
);
CREATE TABLE IF NOT EXISTS onet.related_occupations (
  onetsoc_code CHAR(10) NOT NULL,
  related_onetsoc_code CHAR(10) NOT NULL,
  relatedness_tier VARCHAR(50) NOT NULL,
  related_index DECIMAL(3,0) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (related_onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code)
);
COMMIT;
