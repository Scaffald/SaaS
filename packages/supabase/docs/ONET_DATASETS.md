# O*NET 30.0 Schema Inventory

This file documents the tables populated by the legacy `084_import_onet_full_data.sql` migration. Each table should receive data from the O*NET CSV bundle when we build the new seeding pipeline.

## Table Definitions

### onet.abilities
```
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
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

### onet.alternate_titles
```
CREATE TABLE IF NOT EXISTS onet.alternate_titles (
  onetsoc_code CHAR(10) NOT NULL,
  alternate_title VARCHAR(250) NOT NULL,
  short_title VARCHAR(150),
  sources VARCHAR(50) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));
```

### onet.content_model_reference
```
CREATE TABLE IF NOT EXISTS onet.content_model_reference (
  element_id VARCHAR(20) NOT NULL,
  element_name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (element_id));
```

### onet.dwa_reference
```
CREATE TABLE IF NOT EXISTS onet.dwa_reference (
  element_id VARCHAR(20) NOT NULL,
  iwa_id VARCHAR(20) NOT NULL,
  dwa_id VARCHAR(20) NOT NULL,
  dwa_title VARCHAR(150) NOT NULL,
  PRIMARY KEY (dwa_id),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (iwa_id) REFERENCES onet.iwa_reference (iwa_id));
```

### onet.education_training_experience
```
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
  FOREIGN KEY (element_id, scale_id, category) REFERENCES onet.ete_categories (element_id, scale_id, category));
```

### onet.ete_categories
```
CREATE TABLE IF NOT EXISTS onet.ete_categories (
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0) NOT NULL,
  category_description TEXT NOT NULL,
  PRIMARY KEY (element_id, scale_id, category),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

### onet.interests
```
CREATE TABLE IF NOT EXISTS onet.interests (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

### onet.iwa_reference
```
CREATE TABLE IF NOT EXISTS onet.iwa_reference (
  element_id VARCHAR(20) NOT NULL,
  iwa_id VARCHAR(20) NOT NULL,
  iwa_title VARCHAR(150) NOT NULL,
  PRIMARY KEY (iwa_id),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id));
```

### onet.job_zone_reference
```
CREATE TABLE IF NOT EXISTS onet.job_zone_reference (
  job_zone DECIMAL(1,0) NOT NULL,
  name VARCHAR(50) NOT NULL,
  experience TEXT NOT NULL,
  education TEXT NOT NULL,
  job_training TEXT NOT NULL,
  examples TEXT NOT NULL,
  svp_range VARCHAR(25) NOT NULL,
  PRIMARY KEY (job_zone));
```

### onet.job_zones
```
CREATE TABLE IF NOT EXISTS onet.job_zones (
  onetsoc_code CHAR(10) NOT NULL,
  job_zone DECIMAL(1,0) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (job_zone) REFERENCES onet.job_zone_reference (job_zone));
```

### onet.knowledge
```
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
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

### onet.occupation_data
```
CREATE TABLE IF NOT EXISTS onet.occupation_data (
  onetsoc_code CHAR(10) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (onetsoc_code));
```

### onet.occupation_level_metadata
```
CREATE TABLE IF NOT EXISTS onet.occupation_level_metadata (
  onetsoc_code CHAR(10) NOT NULL,
  item VARCHAR(150) NOT NULL,
  response VARCHAR(75),
  n DECIMAL(4,0),
  percent DECIMAL(4,1),
  date_updated DATE NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));
```

### onet.related_occupations
```
CREATE TABLE IF NOT EXISTS onet.related_occupations (
  onetsoc_code CHAR(10) NOT NULL,
  related_onetsoc_code CHAR(10) NOT NULL,
  relatedness_tier VARCHAR(50) NOT NULL,
  related_index DECIMAL(3,0) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (related_onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));
```

### onet.sample_of_reported_titles
```
CREATE TABLE IF NOT EXISTS onet.sample_of_reported_titles (
  onetsoc_code CHAR(10) NOT NULL,
  reported_job_title VARCHAR(150) NOT NULL,
  shown_in_my_next_move CHAR(1) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));
```

### onet.scales_reference
```
CREATE TABLE IF NOT EXISTS onet.scales_reference (
  scale_id VARCHAR(3) NOT NULL,
  scale_name VARCHAR(50) NOT NULL,
  minimum DECIMAL(1,0) NOT NULL,
  maximum DECIMAL(3,0) NOT NULL,
  PRIMARY KEY (scale_id));
```

### onet.skills
```
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
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

### onet.task_categories
```
CREATE TABLE IF NOT EXISTS onet.task_categories (
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0) NOT NULL,
  category_description TEXT NOT NULL,
  PRIMARY KEY (scale_id, category),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

### onet.task_ratings
```
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
  FOREIGN KEY (scale_id, category) REFERENCES onet.task_categories (scale_id, category));
```

### onet.task_statements
```
CREATE TABLE IF NOT EXISTS onet.task_statements (
  onetsoc_code CHAR(10) NOT NULL,
  task_id DECIMAL(8,0) NOT NULL,
  task TEXT NOT NULL,
  task_type VARCHAR(12),
  incumbents_responding DECIMAL(4,0),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  PRIMARY KEY (task_id),
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));
```

### onet.tasks_to_dwas
```
CREATE TABLE IF NOT EXISTS onet.tasks_to_dwas (
  onetsoc_code CHAR(10) NOT NULL,
  task_id DECIMAL(8,0) NOT NULL,
  dwa_id VARCHAR(20) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (task_id) REFERENCES onet.task_statements (task_id),
  FOREIGN KEY (dwa_id) REFERENCES onet.dwa_reference (dwa_id));
```

### onet.technology_skills
```
CREATE TABLE IF NOT EXISTS onet.technology_skills (
  onetsoc_code CHAR(10) NOT NULL,
  example VARCHAR(150) NOT NULL,
  commodity_code DECIMAL(8,0) NOT NULL,
  hot_technology CHAR(1) NOT NULL,
  in_demand CHAR(1) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (commodity_code) REFERENCES onet.unspsc_reference (commodity_code));
```

### onet.tools_used
```
CREATE TABLE IF NOT EXISTS onet.tools_used (
  onetsoc_code CHAR(10) NOT NULL,
  example VARCHAR(150) NOT NULL,
  commodity_code DECIMAL(8,0) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (commodity_code) REFERENCES onet.unspsc_reference (commodity_code));
```

### onet.unspsc_reference
```
CREATE TABLE IF NOT EXISTS onet.unspsc_reference (
  commodity_code DECIMAL(8,0) NOT NULL,
  commodity_title VARCHAR(150) NOT NULL,
  class_code DECIMAL(8,0) NOT NULL,
  class_title VARCHAR(150) NOT NULL,
  family_code DECIMAL(8,0) NOT NULL,
  family_title VARCHAR(150) NOT NULL,
  segment_code DECIMAL(8,0) NOT NULL,
  segment_title VARCHAR(150) NOT NULL,
  PRIMARY KEY (commodity_code));
```

### onet.work_activities
```
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
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

### onet.work_context
```
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
  FOREIGN KEY (element_id, scale_id, category) REFERENCES onet.work_context_categories (element_id, scale_id, category));
```

### onet.work_context_categories
```
CREATE TABLE IF NOT EXISTS onet.work_context_categories (
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0) NOT NULL,
  category_description TEXT NOT NULL,
  PRIMARY KEY (element_id, scale_id, category),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

### onet.work_styles
```
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
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

### onet.work_values
```
CREATE TABLE IF NOT EXISTS onet.work_values (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
```

## Data Sections

The legacy migration inserts data into each table using `INSERT INTO onet.<table>` statements. The tables populated are:

- `onet.content_model_reference`
- `onet.scales_reference`
- `onet.occupation_data`
- `onet.iwa_reference`
- `onet.job_zones`
- `onet.abilities`
- `onet.skills`
- `onet.knowledge`
- `onet.work_activities`
- `onet.dwa_reference`
- `onet.work_context`
- `onet.work_context_categories`
- `onet.work_styles`
- `onet.work_values`
- `onet.interests`
- `onet.education_training_experience`
- `onet.ete_categories`
- `onet.job_zone_reference`
- `onet.task_statements`
- `onet.task_categories`
- `onet.task_ratings`
- `onet.tasks_to_dwas`
- `onet.tools_used`
- `onet.technology_skills`
- `onet.alternate_titles`
- `onet.sample_of_reported_titles`
- `onet.unspsc_reference`
- `onet.occupation_level_metadata`
- `onet.related_occupations`
