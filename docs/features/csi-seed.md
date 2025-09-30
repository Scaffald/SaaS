CSI Import Task:

# CSI MasterFormat Schema Preparation

We need to update the Postgres schema so it can cleanly import CSI MasterFormat data from Excel.  

## 1. Extensions
```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

- `citext` is required for case-insensitive slugs.  
- `pgcrypto` provides `gen_random_uuid()` for UUIDs in SQL seeding.  

---

## 2. Industries table
Make sure the `"construction"` industry exists and is idempotent.

```sql
INSERT INTO industries (id, slug, name, description, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'construction',
  'construction',
  'CSI MasterFormat skills live under this industry.',
  '{}'::jsonb,
  NOW(), NOW()
)
ON CONFLICT (slug) DO NOTHING;
```

---

## 3. Skills table updates

### 3.1 Name uniqueness
Skills with the same name may exist in different industries.  
```sql
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS skills_unique_name_per_industry
  ON skills (industry_id, name);
```

### 3.2 CSI columns
Add CSI-aware fields for hierarchy, natural keys, and depth.

```sql
ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS csi text[4] NOT NULL DEFAULT ARRAY['00','00','00','00'],
  ADD COLUMN IF NOT EXISTS code_display text
    GENERATED ALWAYS AS (
      csi[1] || ' ' || csi[2] || ' ' || csi[3] ||
      CASE WHEN csi[4] <> '00' THEN '.' || csi[4] ELSE '' END
    ) STORED,
  ADD COLUMN IF NOT EXISTS code_key citext
    GENERATED ALWAYS AS ((csi[1] || '-' || csi[2] || '-' || csi[3] || '-' || csi[4])::citext) STORED,
  ADD COLUMN IF NOT EXISTS depth smallint
    GENERATED ALWAYS AS (
      CASE
        WHEN csi[4] <> '00' THEN 4
        WHEN csi[3] <> '00' THEN 3
        WHEN csi[2] <> '00' THEN 2
        ELSE 1
      END
    ) STORED;
```

### 3.3 CSI validation
```sql
ALTER TABLE skills
  ADD CONSTRAINT skills_csi_format_chk CHECK (
    array_length(csi, 1) = 4
    AND csi[1] ~ '^\d{2}$'
    AND csi[2] ~ '^\d{2}$'
    AND csi[3] ~ '^\d{2}$'
    AND csi[4] ~ '^\d{2}$'
  );
```

### 3.4 CSI unique index
```sql
CREATE UNIQUE INDEX IF NOT EXISTS skills_code_key_ux ON skills (code_key);
```

---

## 4. Indexes for performance
```sql
CREATE INDEX IF NOT EXISTS skills_parent_id_idx ON skills (parent_id);
CREATE INDEX IF NOT EXISTS skills_industry_depth_idx ON skills (industry_id, depth);
CREATE INDEX IF NOT EXISTS skills_active_idx ON skills (active) WHERE active = true;
```

---

## 5. Integrity trigger
Prevent cross-industry parent/child mismatches.

```sql
CREATE OR REPLACE FUNCTION skills_enforce_parent_industry()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    PERFORM 1
    FROM skills p
    WHERE p.id = NEW.parent_id
      AND p.industry_id = NEW.industry_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'industry_id mismatch with parent_id=% for skill %', NEW.parent_id, NEW.id
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_skills_enforce_parent_industry ON skills;

CREATE TRIGGER trg_skills_enforce_parent_industry
  BEFORE INSERT OR UPDATE OF parent_id, industry_id
  ON skills
  FOR EACH ROW
  EXECUTE FUNCTION skills_enforce_parent_industry();
```

---

## 6. What this gives us
- `csi` → array of 4 two-digit codes (`["03","11","13","16"]`).  
- `code_display` → human format (`"03 11 13.16"`).  
- `code_key` → stable natural key (`"03-11-13-16"`), unique.  
- `depth` → 1..4 (Division → Level-4).  
- `(industry_id, name)` uniqueness, not global.  
- Trigger ensures parents/children always belong to the same industry.  

---

👉 After applying this migration, we can write a script that parses the Excel, generates deterministic UUIDs per `code_key`, assigns the `"construction"` industry, wires `parent_id`, and seeds the skills table safely.
