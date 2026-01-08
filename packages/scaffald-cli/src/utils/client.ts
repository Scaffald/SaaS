/**
 * SDK Client Utilities
 * Initialize and configure the Scaffald SDK client
 */

import { Scaffald } from '@scaffald/sdk'
import { getApiKey, getBaseUrl } from '../config.js'
import chalk from 'chalk'

export function createClient(apiKeyOverride?: string): InstanceType<typeof Scaffald> {
  const apiKey = apiKeyOverride || getApiKey()

  if (!apiKey) {
    console.error(chalk.red('Error:'), 'No API key provided')
    console.log(chalk.yellow('Run:'), 'scaffald auth login')
    process.exit(1)
  }

  const baseUrl = getBaseUrl()

  return new Scaffald({
    apiKey,
    baseUrl,
    maxRetries: 3,
  })
}
