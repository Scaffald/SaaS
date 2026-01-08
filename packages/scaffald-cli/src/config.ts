/**
 * Configuration Management
 * Handles storing and retrieving CLI configuration (API keys, base URL, etc.)
 */

import Conf from 'conf'
import chalk from 'chalk'

interface ScaffaldConfig {
  apiKey?: string
  baseUrl?: string
  organizationId?: string
}

const config = new Conf<ScaffaldConfig>({
  projectName: 'scaffald-cli',
  schema: {
    apiKey: {
      type: 'string',
    },
    baseUrl: {
      type: 'string',
      default: 'https://api.scaffald.com',
    },
    organizationId: {
      type: 'string',
    },
  },
})

export function setApiKey(apiKey: string): void {
  config.set('apiKey', apiKey)
  console.log(chalk.green('✓'), 'API key saved successfully')
}

export function getApiKey(): string | undefined {
  return config.get('apiKey')
}

export function setBaseUrl(baseUrl: string): void {
  config.set('baseUrl', baseUrl)
  console.log(chalk.green('✓'), 'Base URL saved successfully')
}

export function getBaseUrl(): string {
  return config.get('baseUrl') || 'https://api.scaffald.com'
}

export function setOrganizationId(organizationId: string): void {
  config.set('organizationId', organizationId)
  console.log(chalk.green('✓'), 'Organization ID saved successfully')
}

export function getOrganizationId(): string | undefined {
  return config.get('organizationId')
}

export function clearConfig(): void {
  config.clear()
  console.log(chalk.green('✓'), 'Configuration cleared')
}

export function getConfig(): ScaffaldConfig {
  return config.store
}

export function ensureApiKey(): string {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.error(chalk.red('Error:'), 'No API key found')
    console.log(chalk.yellow('Run:'), 'scaffald auth login')
    process.exit(1)
  }
  return apiKey
}
