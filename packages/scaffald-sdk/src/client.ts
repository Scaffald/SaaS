import { DEFAULT_CONFIG, type ScaffaldConfig, type ScaffaldConfigInternal } from './config.js'
import { HttpClient, type RateLimitInfo } from './http/client.js'
import { Jobs } from './resources/jobs.js'
import { Applications } from './resources/applications.js'
import { Profiles } from './resources/profiles.js'
import { Industries } from './resources/industries.js'
import { Organizations } from './resources/organizations.js'
import { Teams } from './resources/teams.js'

export class Scaffald {
  private http: HttpClient

  public readonly jobs: Jobs
  public readonly applications: Applications
  public readonly profiles: Profiles
  public readonly industries: Industries
  public readonly organizations: Organizations
  public readonly teams: Teams

  constructor(config: ScaffaldConfig) {
    if (!config.apiKey && !config.accessToken) {
      throw new Error('Either apiKey or accessToken must be provided')
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
  }

  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.http.getRateLimitInfo()
  }
}
