/**
 * Authentication Commands
 * Login, logout, and status
 */

import { Command } from 'commander'
import enquirer from 'enquirer'
import chalk from 'chalk'
import { setApiKey, clearConfig, getConfig } from '../config.js'
import { formatSuccess, formatCompact } from '../utils/output.js'

export const authCommand = new Command('auth')
  .description('Manage authentication')
  .addCommand(
    new Command('login')
      .description('Login with API key')
      .option('-k, --key <apiKey>', 'API key')
      .action(async (options) => {
        let apiKey = options.key

        if (!apiKey) {
          const response = await enquirer.prompt<{ apiKey: string }>({
            type: 'password',
            name: 'apiKey',
            message: 'Enter your API key:',
          })
          apiKey = response.apiKey
        }

        if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk_')) {
          console.error(chalk.red('Error:'), 'Invalid API key format')
          console.log(chalk.yellow('Hint:'), 'API keys start with "sk_"')
          process.exit(1)
        }

        setApiKey(apiKey)
        formatSuccess('Logged in successfully')
      })
  )
  .addCommand(
    new Command('logout')
      .description('Logout and clear stored credentials')
      .action(() => {
        clearConfig()
        formatSuccess('Logged out successfully')
      })
  )
  .addCommand(
    new Command('status')
      .description('Show current authentication status')
      .action(() => {
        const config = getConfig()

        if (!config.apiKey) {
          console.log(chalk.yellow('Not logged in'))
          console.log(chalk.cyan('Run:'), 'scaffald auth login')
          return
        }

        const maskedKey = `${config.apiKey.slice(0, 10)}...${config.apiKey.slice(-4)}`

        formatCompact([
          { label: 'Status:', value: chalk.green('Logged in') },
          { label: 'API Key:', value: maskedKey },
          { label: 'Base URL:', value: config.baseUrl || 'https://api.scaffald.com' },
          ...(config.organizationId
            ? [{ label: 'Organization ID:', value: config.organizationId }]
            : []),
        ])
      })
  )
