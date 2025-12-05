# O*NET 30.0 CSV Mapping

The upcoming seeding pipeline will ingest the official O\*NET 30.0 `db_30_0_text` bundle and fan its tab-delimited text files into the `onet.*` tables created by `085_onet_schema.sql`.

## Storage Layout

```
packages/supabase/seed-data/onet/
├── raw/                # auto-extracted contents of db_30_0_text.zip (not committed)
└── cache/              # optional staging area for processed CSVs
```

- The seeding script will download (or use a locally supplied) `db_30_0_text.zip`.
- Extracted `.txt` files are tab-delimited with a header row and will live under `raw/`.
- Any derived/intermediate CSVs created during parsing can be written to `cache/` and ignored via `.gitignore`.

## File → Table Mapping

| Source file (tab-delimited) | Target table | Notes |
| --- | --- | --- |
| `Content Model Reference.txt` | `onet.content_model_reference` | master list of element IDs |
| `Scales Reference.txt` | `onet.scales_reference` | defines scale metadata |
| `Occupation Data.txt` | `onet.occupation_data` | canonical O\*NET-SOC titles & descriptions |
| `IWA Reference.txt` | `onet.iwa_reference` | intermediate work activities |
| `DWA Reference.txt` | `onet.dwa_reference` | detailed work activities (links to IWA & CM) |
| `Job Zone Reference.txt` | `onet.job_zone_reference` | descriptive text for each job zone |
| `Job Zones.txt` | `onet.job_zones` | occupation ↔ job zone assignments |
| `Abilities.txt` | `onet.abilities` | occupation-level ability scores |
| `Skills.txt` | `onet.skills` | occupation-level skill scores |
| `Knowledge.txt` | `onet.knowledge` | occupation-level knowledge scores |
| `Work Activities.txt` | `onet.work_activities` | general work activity scores |
| `Work Styles.txt` | `onet.work_styles` | work style ratings |
| `Work Values.txt` | `onet.work_values` | work value ratings |
| `Interests.txt` | `onet.interests` | Holland interest profiles |
| `Education, Training, and Experience.txt` | `onet.education_training_experience` | ties to `ete_categories` |
| `Education, Training, and Experience Categories.txt` | `onet.ete_categories` | category descriptions |
| `Work Context Categories.txt` | `onet.work_context_categories` | category lookup |
| `Work Context.txt` | `onet.work_context` | occupational work context values |
| `Task Categories.txt` | `onet.task_categories` | lookup table for task categories |
| `Task Statements.txt` | `onet.task_statements` | task descriptions per occupation |
| `Task Ratings.txt` | `onet.task_ratings` | rating metrics per task |
| `Tasks to DWAs.txt` | `onet.tasks_to_dwas` | task ↔ DWA bridge |
| `Tools Used.txt` | `onet.tools_used` | tool examples and UNSPSC codes |
| `Technology Skills.txt` | `onet.technology_skills` | software/technology examples |
| `UNSPSC Reference.txt` | `onet.unspsc_reference` | commodity catalog |
| `Alternate Titles.txt` | `onet.alternate_titles` | common aliases per occupation |
| `Sample of Reported Titles.txt` | `onet.sample_of_reported_titles` | crowd-sourced titles |
| `Occupation Level Metadata.txt` | `onet.occupation_level_metadata` | survey metadata |
| `Related Occupations.txt` | `onet.related_occupations` | related SOC pairings |

### Relationship helpers

Some auxiliary relationship files (e.g. `Abilities to Work Activities.txt`, `Skills to Work Context.txt`) are not required for the initial seed but can be ingested later if we model crosswalk tables.

## Next Steps

- The seeding script will read from `raw/*.txt`, stream-parse via `csv-parse`, and upsert into the matching tables.
- A `.gitignore` entry will exclude both `packages/supabase/seed-data/onet/raw/` and `packages/supabase/seed-data/onet/cache/`.
- Documentation in `SEEDING.md` will be updated once the script is in place.


