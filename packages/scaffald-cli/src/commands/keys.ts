/**
 * API Keys Commands
 * List, view, and manage API keys
 */

import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import type { ApiKey } from '@scaffald/sdk'
import { createClient } from '../utils/client.js'
import { formatTable, formatJson, formatCompact } from '../utils/output.js'
import { getOrganizationId } from '../config.js'

export const keysCommand = new Command('keys')
  .description('Manage API keys')
  .addCommand(
    new Command('list')
      .description('List API keys')
      .option('--org <organizationId>', 'Organization ID')
      .option('--format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        const organizationId = options.org || getOrganizationId()

        if (!organizationId) {
          console.error(chalk.red('Error:'), 'Organization ID required')
          console.log(chalk.yellow('Hint:'), 'Use --org flag or set with: scaffald config set org <id>')
          process.exit(1)
        }

        const spinner = ora('Fetching API keys...').start()

        try {
          const client = createClient()
          const keys = await client.apiKeys.list()

          spinner.succeed(`Found ${keys.length} API key(s)`)

          if (keys.length === 0) {
            console.log(chalk.yellow('No API keys found'))
            return
          }

          if (options.format === 'json') {
            formatJson(keys)
          } else {
            const headers = ['ID', 'Name', 'Prefix', 'Status', 'Last Used', 'Created']
            const rows = keys.map((key: ApiKey) => [
              key.id.slice(0, 8),
              key.name,
              key.key_prefix,
              key.is_active ? chalk.green('Active') : chalk.gray('Inactive'),
              key.last_used_at
                ? new Date(key.last_used_at).toLocaleDateString()
                : chalk.gray('Never'),
              new Date(key.created_at).toLocaleDateString(),
            ])
            formatTable(headers, rows, { title: 'API Keys' })
          }
        } catch (error) {
          spinner.fail('Failed to fetch API keys')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
  .addCommand(
    new Command('view')
      .description('View API key details')
      .argument('<id>', 'API Key ID')
      .option('--format <format>', 'Output format (compact, json)', 'compact')
      .action(async (id: string, options: Record<string, string>) => {
        const spinner = ora('Fetching API key...').start()

        try {
          const client = createClient()
          const keys = await client.apiKeys.list()
          const apiKey = keys.find((k) => k.id === id)

          if (!apiKey) {
            spinner.fail('API key not found')
            process.exit(1)
          }

          spinner.succeed('API key fetched')

          if (options.format === 'json') {
            formatJson(apiKey)
          } else {
            console.log(chalk.bold.cyan(`\nAPI Key: ${apiKey.name}`))
            console.log(chalk.gray('─'.repeat(60)))
            console.log()

            formatCompact([
              { label: 'ID:', value: apiKey.id },
              { label: 'Name:', value: apiKey.name },
              { label: 'Prefix:', value: apiKey.key_prefix },
              {
                label: 'Status:',
                value: apiKey.is_active ? chalk.green('Active') : chalk.gray('Inactive'),
              },
              { label: 'Scopes:', value: apiKey.scopes?.join(', ') || 'All' },
              {
                label: 'Rate Limit Tier:',
                value: apiKey.rate_limit_tier || 'free',
              },
              { label: 'Created:', value: new Date(apiKey.created_at).toLocaleDateString() },
              ...(apiKey.last_used_at
                ? [
                    {
                      label: 'Last Used:',
                      value: new Date(apiKey.last_used_at).toLocaleString(),
                    },
                  ]
                : []),
              ...(apiKey.expires_at
                ? [
                    {
                      label: 'Expires:',
                      value: new Date(apiKey.expires_at).toLocaleDateString(),
                    },
                  ]
                : []),
            ])
          }
        } catch (error) {
          spinner.fail('Failed to fetch API key')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
  .addCommand(
    new Command('usage')
      .description('View API key usage statistics')
      .argument('<id>', 'API Key ID')
      .option('-d, --days <days>', 'Number of days to look back', '7')
      .option('--format <format>', 'Output format (compact, json)', 'compact')
      .action(async (id: string, options: Record<string, string>) => {
        const spinner = ora('Fetching usage statistics...').start()

        try {
          const client = createClient()
          const stats = await client.apiKeys.getUsage(id, { days: Number.parseInt(options.days, 10) })

          spinner.succeed('Usage statistics fetched')

          if (options.format === 'json') {
            formatJson(stats)
          } else {
            console.log(chalk.bold.cyan(`\nAPI Key Usage (Last ${options.days} days)`))
            console.log(chalk.gray('─'.repeat(60)))
            console.log()

            formatCompact([
              { label: 'Total Requests:', value: stats.total_requests.toString() },
              { label: 'Successful:', value: chalk.green(stats.success_requests.toString()) },
              { label: 'Errors:', value: stats.error_requests > 0 ? chalk.red(stats.error_requests.toString()) : '0' },
              {
                label: 'Error Rate:',
                value: `${stats.error_rate}%`,
              },
              { label: 'Avg Response Time:', value: `${Math.round(stats.avg_response_time_ms)}ms` },
            ])

            // Endpoint breakdown
            const endpoints: Record<string, number> = {}
            for (const u of stats.usage) {
              const key = `${u.method} ${u.endpoint}`
              endpoints[key] = (endpoints[key] || 0) + 1
            }

            console.log()
            console.log(chalk.bold('Top Endpoints:'))
            const sortedEndpoints = Object.entries(endpoints)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)

            for (const [endpoint, count] of sortedEndpoints) {
              console.log(`  ${endpoint.padEnd(40)} ${chalk.cyan(count.toString())} requests`)
            }
          }
        } catch (error) {
          spinner.fail('Failed to fetch usage statistics')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
