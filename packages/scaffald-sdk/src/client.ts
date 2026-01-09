import { DEFAULT_CONFIG, type ScaffaldConfig, type ScaffaldConfigInternal } from './config.js'
import { HttpClient, type RateLimitInfo } from './http/client.js'
import { Jobs } from './resources/jobs.js'

export class Scaffald {
  private http: HttpClient

  public readonly jobs: Jobs

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
  }

  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.http.getRateLimitInfo()
  }
}
