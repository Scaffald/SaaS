import { DEFAULT_CONFIG, type ScaffaldConfig, type ScaffaldConfigInternal } from './config.js'
import { HttpClient, type RateLimitInfo } from './http/client.js'
import { Jobs } from './resources/jobs.js'
import { Applications } from './resources/applications.js'
import { Profiles } from './resources/profiles.js'
import { Industries } from './resources/industries.js'
import { Organizations } from './resources/organizations.js'
import { Teams } from './resources/teams.js'
import { Prerequisites } from './resources/prerequisites.js'
import { ApiKeys } from './resources/api-keys.js'
import { WebhooksManagement } from './resources/webhooks-management.js'
import { Connections } from './resources/connections.js'
import { Follows } from './resources/follows.js'
import { Engagement } from './resources/engagement.js'
import { BackgroundChecks } from './resources/background-checks.js'
import { Inquiries } from './resources/inquiries.js'
import { WorkLogs } from './resources/work-logs.js'
import { Skills } from './resources/skills.js'

export class Scaffald {
  private http: HttpClient

  public readonly jobs: Jobs
  public readonly applications: Applications
  public readonly profiles: Profiles
  public readonly industries: Industries
  public readonly organizations: Organizations
  public readonly teams: Teams
  public readonly prerequisites: Prerequisites
  public readonly apiKeys: ApiKeys
  public readonly webhooks: WebhooksManagement
  public readonly connections: Connections
  public readonly follows: Follows
  public readonly engagement: Engagement
  public readonly backgroundChecks: BackgroundChecks
  public readonly inquiries: Inquiries
  public readonly workLogs: WorkLogs
  public readonly skills: Skills

  constructor(config: ScaffaldConfig) {
    if (!config.apiKey && !config.accessToken && !config.supabaseToken) {
      throw new Error('Either apiKey, accessToken, or supabaseToken must be provided')
    }

    const internalConfig: ScaffaldConfigInternal = {
      ...DEFAULT_CONFIG,
      ...config,
    }

    this.http = new HttpClient(internalConfig)
    this.jobs = new Jobs(this.http)
    this.applications = new Applications(this.http)
    this.profiles = new Profiles(this.http)
    this.industries = new Industries(this.http)
    this.organizations = new Organizations(this.http)
    this.teams = new Teams(this.http)
    this.prerequisites = new Prerequisites(this.http)
    this.apiKeys = new ApiKeys(this.http)
    this.webhooks = new WebhooksManagement(this.http)
    this.connections = new Connections(this.http)
    this.follows = new Follows(this.http)
    this.engagement = new Engagement(this.http)
    this.backgroundChecks = new BackgroundChecks(this.http)
    this.inquiries = new Inquiries(this.http)
    this.workLogs = new WorkLogs(this.http)
    this.skills = new Skills(this.http)
  }

  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.http.getRateLimitInfo()
  }
}
