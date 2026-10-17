/**
 * `/v1/engagement/metrics`, named for what it counts (#1249).
 *
 * The route counts `engagement.activity_events` rows whose `user_id` is the
 * caller — things the user DID: searches they ran, profiles and jobs they
 * opened, applications they started. Its wire names (`searches`,
 * `profile_views`) read as exposure — how often the user was searched for or
 * viewed — and Home did read them that way twice: "Search appearances" and
 * "Employers found you N times in search" were both the worker's own searches
 * (#1171, #1249). Exposure figures live in the analytics summary
 * (`searchAppearances`) and profile-view analytics, never here.
 *
 * The wire names stay until the SDK's `EngagementMetrics` type is renamed;
 * this is the only shape the app reads, so no consumer sees the old names.
 */
import type { EngagementMetrics } from '@scaffald/sdk'

export interface OwnActivityMetrics {
  /** Searches the user ran. Not appearances in anyone else's search. */
  searchesRun: number
  /** Profiles the user opened. Not views of the user's profile. */
  profilesViewed: number
  /** Job postings the user opened. */
  jobsViewed: number
  /** Applications the user started. */
  applicationsStarted: number
  /** Applications the user submitted. */
  applicationsSubmitted: number
  /** Every event the user generated in the window. */
  totalOwnEvents: number
}

export function toOwnActivityMetrics(metrics: EngagementMetrics): OwnActivityMetrics {
  return {
    searchesRun: metrics.searches ?? 0,
    profilesViewed: metrics.profile_views ?? 0,
    jobsViewed: metrics.job_views ?? 0,
    applicationsStarted: metrics.applications_started ?? 0,
    applicationsSubmitted: metrics.applications_completed ?? 0,
    totalOwnEvents: metrics.total_events ?? 0,
  }
}
