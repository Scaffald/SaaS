## Setting up Supabase

To go through the Supabase setup, CD to the root of the directory and run `pnpm setup`.

Here are some guides from the official Supabase documentation:

- [Local Development](https://supabase.com/docs/guides/getting-started/local-development)
- [Managing Environments](https://supabase.com/docs/guides/cli/managing-environments)

NOTE: This template assumes you have a public storage bucket with the name `avatars` - Make sure to create it if it doesn't exist.

After setting it up, you can use the [scripts](#scripts) to manage the common tasks related to Supabase.

## Scripts

NOTE: Scripts starting with underscore (`_`) are not meant to be used directly.

You can also run these scripts from the root by adding `supa` after pnpm. So `pnpm supa start` or `pnpm supa g`.

#### Link Project

Links your remote Supabase project. Set `EXPO_PUBLIC_SUPABASE_PROJECT_ID` in your `.env` to your Supabase's instance before running.

```shell
pnpm link-project
```

#### Generate

Generates types from your local Docker Supabase instance.

```shell
pnpm generate
pnpm g #alias
```

- [Reference](https://supabase.com/docs/guides/api/rest/generating-types)

#### Generate Remote

Generates types from your remote Supabase instance using your project ID specific id in the root env files.

```shell
pnpm generate:remote
```

### Type Helpers

`supabase/helpers` file has additional type definition helpers as shown in Supabase's [documentation](https://www.supabase.com/docs/reference/javascript/typescript-support) that can be imported through out the project.

#### New Migration

Generates a new migration by diffing against the db.

```shell
pnpm migration:diff <MIGRATION_NAME>
```

- [Reference](https://supabase.com/docs/reference/cli/supabase-db-diff)

#### Push local migrations to remote

Generates a new migration by diffing against the db.

```shell
pnpm deploy
```

- [Reference](https://supabase.com/docs/reference/cli/supabase-db-push)

#### Push auth/config with env templating

`packages/supabase/config.toml` intentionally keeps `env(MY_VAR)` placeholders so we never commit secrets.
Use the helper scripts below to render those values from the matching `.env.*` file before running any
`supabase config` commands:

```shell
pnpm supa:config:push            # uses .env
pnpm supa:config:push:preview    # uses .env.preview
pnpm supa:config:push:prod       # uses .env.production
```

Each script loads the proper env file, substitutes the placeholders, runs the Supabase CLI command, then restores
the template so git stays clean.

#### Start

Start local Supabase instance.

```shell
pnpm start
```

#### Stop

Stop local Supabase instance.

```shell
pnpm stop
```

#### Reset

Reset local Supabase DB.

```shell
pnpm reset
```

#### Lint

```shell
pnpm lint
```

## Profile verification fields

Administrative clients should call the `public.verify_profile_field` and `public.revoke_profile_field` functions to manage the
`public.profile_verifications` audit log. The `field` column uses canonical identifiers so UI layers can consistently map
verification badges back to profile sections. The triggers created in the migration automatically revoke the relevant fields
whenever worker jobs mutate the underlying tables (including `public.user_skills` for skill changes).

### Basic profile (`public.users`)
- `basic.display_name` — Display name surfaced on profile headers and cards.
- `basic.headline` — Short professional headline.
- `basic.bio` — Full bio/summary text.
- `basic.avatar` — Avatar URL or media reference.
- `basic.industry` — Selected industry reference.
- `basic.experience` — Years of experience total.
- `skills.summary` — JSON skills summary blob.
- `skills.list` — Verified skill inventory; toggles `user_skills.source/last_verified_at`.
- `availability.open_to_work` — Open-to-work availability toggle.

### Contact & compliance (`public.user_private`)
- `contact.email` — Primary email address.
- `contact.phone` — Phone number.
- `contact.address` — Structured mailing address JSON.
- `contact.geo` — Geo coordinate point.
- `contact.preferences` — Contact preference array.
- `contact.location` — Free-form location text.
- `contact.phone_os` — Mobile OS metadata.
- `availability.open_to_travel` — Travel willingness flag.
- `availability.schedule` — Availability selections array.
- `background.veteran_status` — Veteran status indicator.
- `background.us_resident` — U.S. residency flag.
- `background.us_passport` — Passport possession flag.
- `background.travel_mileage` — Travel radius mileage.
- `background.education` — Highest education level.
- `compensation.hourly_rate` — Hourly rate expectation.
- `credentials.drivers_license` — Driver license class.
- `credentials.certifications` — Certification list.

### Account profile (`public.profiles`)
- `basic.full_name` — Legal or preferred full name stored in `profiles`.
- `basic.about` — Long-form about copy.
- `basic.avatar` — Avatar override stored in `profiles` (if used).

### Projects & work history (`public.projects`)
- `projects.name` — Project/work item name.
- `projects.description` — Description/body copy.
- `projects.type` — Project type label.
- `projects.paid` — Paid project flag.
- `projects.location` — Street or locality string.
- `projects.zip` — ZIP/postal code.
- `projects.duration` — Number of days or duration metadata.
