/**
 * Turn education entries as the client sends them into rows for
 * core.user_education (#1357).
 *
 * The save used to upsert the entries verbatim, which failed three ways:
 *
 * - The form's blank dates arrive as `''`, and Postgres rejects `''` for DATE.
 * - `custom_degree_type` is not a column, so any entry carrying it failed.
 * - Existing rows (with an id) and a new row (without one) in one bulk upsert
 *   make supabase-js send NULL for the new row's id, violating the primary key.
 *
 * So every row is rebuilt from a whitelist of real columns, blanks become null,
 * a custom degree is folded into `degree_type` (the client already reads a
 * non-standard `degree_type` back as "Other" + that text — see
 * scf-core `normalizeEducationEntry`), and new rows are split from updates so
 * an insert never carries an `id` key at all.
 */

export interface EducationEntryInput {
  id?: string;
  university_id?: string | null;
  institution_name: string;
  is_verified?: boolean;
  degree_type?: string | null;
  custom_degree_type?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  expected_graduation_date?: string | null;
  is_current?: boolean;
  gpa?: number | null;
  description?: string | null;
  location?: string | null;
}

export interface EducationRow {
  user_id: string;
  university_id: string | null;
  institution_name: string;
  is_verified: boolean;
  degree_type: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  expected_graduation_date: string | null;
  is_current: boolean;
  gpa: number | null;
  description: string | null;
  location: string | null;
  updated_at: string;
}

export interface EducationWrites {
  /** Rows that already exist, keyed by their id. */
  updates: Array<EducationRow & { id: string }>;
  /** New rows. Never carry an `id` key, so Postgres generates one. */
  inserts: EducationRow[];
}

/** `''` and whitespace become null; anything else is trimmed. */
function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** "Other" plus a custom name is stored as the custom name itself. */
function resolveDegreeType(entry: EducationEntryInput): string | null {
  const degree = blankToNull(entry.degree_type);
  const custom = blankToNull(entry.custom_degree_type);
  if (degree === "Other" && custom) return custom;
  return degree;
}

export function toEducationRow(
  entry: EducationEntryInput,
  userId: string,
  now: string,
): EducationRow {
  return {
    user_id: userId,
    university_id: blankToNull(entry.university_id),
    institution_name: entry.institution_name.trim(),
    is_verified: entry.is_verified ?? false,
    degree_type: resolveDegreeType(entry),
    field_of_study: blankToNull(entry.field_of_study),
    start_date: blankToNull(entry.start_date),
    end_date: blankToNull(entry.end_date),
    expected_graduation_date: blankToNull(entry.expected_graduation_date),
    is_current: entry.is_current ?? false,
    gpa: typeof entry.gpa === "number" ? entry.gpa : null,
    description: blankToNull(entry.description),
    location: blankToNull(entry.location),
    updated_at: now,
  };
}

export function prepareEducationWrites(
  entries: EducationEntryInput[],
  userId: string,
  now: string = new Date().toISOString(),
): EducationWrites {
  const updates: EducationWrites["updates"] = [];
  const inserts: EducationWrites["inserts"] = [];
  for (const entry of entries) {
    const row = toEducationRow(entry, userId, now);
    const id = blankToNull(entry.id);
    if (id) updates.push({ id, ...row });
    else inserts.push(row);
  }
  return { updates, inserts };
}
