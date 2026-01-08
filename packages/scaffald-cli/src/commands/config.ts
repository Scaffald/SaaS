/**
 * Config Commands
 * View and update CLI configuration
 */

import { Command } from 'commander'
import chalk from 'chalk'
import {
  getConfig,
  setApiKey,
  setBaseUrl,
  setOrganizationId,
  clearConfig,
} from '../config.js'
import { formatCompact, formatJson } from '../utils/output.js'

export const configCommand = new Command('config')
  .description('Manage CLI configuration')
  .addCommand(
    new Command('show')
      .description('Show current configuration')
      .option('--format <format>', 'Output format (compact, json)', 'compact')
      .action((options) => {
        const config = getConfig()

        if (options.format === 'json') {
          formatJson(config)
        } else {
          console.log(chalk.bold.cyan('\nConfiguration'))
          console.log(chalk.gray('─'.repeat(60)))
          console.log()

          const maskedKey = config.apiKey
            ? `${config.apiKey.slice(0, 10)}...${config.apiKey.slice(-4)}`
            : chalk.gray('Not set')

          formatCompact([
            { label: 'API Key:', value: maskedKey },
            { label: 'Base URL:', value: config.baseUrl || chalk.gray('Not set') },
            { label: 'Organization ID:', value: config.organizationId || chalk.gray('Not set') },
          ])
        }
      })
  )
  .addCommand(
    new Command('set')
      .description('Set configuration value')
      .argument('<key>', 'Configuration key (api-key, base-url, org)')
      .argument('<value>', 'Configuration value')
      .action((key: string, value: string) => {
        switch (key) {
          case 'api-key':
          case 'apiKey':
            setApiKey(value)
            break
          case 'base-url':
          case 'baseUrl':
            setBaseUrl(value)
            break
          case 'org':
          case 'organizationId':
            setOrganizationId(value)
            break
          default:
            console.error(chalk.red('Error:'), `Unknown configuration key: ${key}`)
            console.log(
              chalk.yellow('Valid keys:'),
              'api-key, base-url, org'
            )
            process.exit(1)
        }
      })
  )
  .addCommand(
    new Command('clear')
      .description('Clear all configuration')
      .action(() => {
        clearConfig()
      })
  )
