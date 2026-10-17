/**
 * The employer a jobs listing is scoped to, read from `?org=` (#1282).
 *
 * The map's employer preview opens `/jobs/browse?org=<id>` ("View jobs"),
 * and the listing ignored it, so the person landed on every job instead of
 * that employer's. `GET /v1/jobs` validates `organizationId` as a UUID and
 * answers anything else with a 400, which would empty the whole list over a
 * mangled link, so a value that is not a UUID scopes nothing.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function readOrgParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  const trimmed = raw?.trim()
  return trimmed && UUID.test(trimmed) ? trimmed : undefined
}
