# O*NET seed data

The O*NET seed step in `pnpm supa:seed` (Step 5) expects text files (e.g. `Occupation Data.txt`) in `packages/supabase/seed-data/onet/raw/`.

## Fetch and prepare data

Run the download script to fetch the O*NET 30.0 text bundle from onetcenter.org and extract it into `seed-data/onet/raw/`:

From the repo root:

```bash
pnpm --filter @scf/supabase run download-onet
```

Or from `packages/supabase`:

```bash
pnpm run download-onet
```

By default this downloads the text zip, extracts it, and optionally runs the MySQL→SQL conversion. For seed-only you only need the text files.

Options:

- `--text-only` – Only download and extract the text bundle (skip MySQL SQL files).
- `--force-text` – Re-download the text zip even if it already exists.
- `--force-extract` – Re-extract into `raw/` even if files are present.

After the files are in place, run:

```bash
pnpm supa:seed
```

O*NET seeding will run as Step 5 of the full seed.
