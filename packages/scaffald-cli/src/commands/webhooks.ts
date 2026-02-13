/**
 * Webhooks Commands
 * List, create, update, delete, and test webhooks
 */

import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { createClient } from '../utils/client.js'
import { formatTable, formatJson, formatCompact } from '../utils/output.js'
import { getOrganizationId } from '../config.js'

export const webhooksCommand = new Command('webhooks')
  .description('Manage webhooks')
  .addCommand(
    new Command('list')
      .description('List webhooks')
      .option('--org <organizationId>', 'Organization ID')
      .option('--format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        const organizationId = options.org || getOrganizationId()

        if (!organizationId) {
          console.error(chalk.red('Error:'), 'Organization ID required')
          console.log(chalk.yellow('Hint:'), 'Use --org flag or set with: scaffald config set org <id>')
          process.exit(1)
        }

        const spinner = ora('Fetching webhooks...').start()

        try {
          const client = createClient()
          const response = await client.webhooks.list({ organizationId })

          spinner.succeed(`Found ${response.data.length} webhook(s)`)

          if (response.data.length === 0) {
            console.log(chalk.yellow('No webhooks configured'))
            return
          }

          if (options.format === 'json') {
            formatJson(response.data)
          } else {
            const headers = ['ID', 'URL', 'Status', 'Events', 'Created']
            const rows = response.data.map((webhook: Record<string, unknown>) => [
              webhook.id.slice(0, 8),
              webhook.url.slice(0, 40) + (webhook.url.length > 40 ? '...' : ''),
              webhook.is_active ? chalk.green('Active') : chalk.gray('Inactive'),
              webhook.events.length.toString(),
              new Date(webhook.created_at).toLocaleDateString(),
            ])
            formatTable(headers, rows, { title: 'Webhooks' })
          }
        } catch (error) {
          spinner.fail('Failed to fetch webhooks')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
  .addCommand(
    new Command('view')
      .description('View webhook details')
      .argument('<id>', 'Webhook ID')
      .option('--format <format>', 'Output format (compact, json)', 'compact')
      .action(async (id: string, options: Record<string, string>) => {
        const spinner = ora('Fetching webhook...').start()

        try {
          const client = createClient()
          const response = await client.webhooks.retrieve(id)
          const webhook = response.data

          spinner.succeed('Webhook fetched')

          if (options.format === 'json') {
            formatJson(webhook)
          } else {
            console.log(chalk.bold.cyan(`\nWebhook: ${webhook.url}`))
            console.log(chalk.gray('─'.repeat(60)))
            console.log()

            formatCompact([
              { label: 'ID:', value: webhook.id },
              {
                label: 'Status:',
                value: webhook.is_active ? chalk.green('Active') : chalk.gray('Inactive'),
              },
              { label: 'URL:', value: webhook.url },
              { label: 'Description:', value: webhook.description || 'N/A' },
              { label: 'Events:', value: webhook.events.join(', ') },
              { label: 'Max Retries:', value: webhook.retry_max_attempts.toString() },
              { label: 'Timeout:', value: `${webhook.timeout_ms}ms` },
              { label: 'Created:', value: new Date(webhook.created_at).toLocaleDateString() },
              ...(webhook.last_delivery_at
                ? [
                    {
                      label: 'Last Delivery:',
                      value: new Date(webhook.last_delivery_at).toLocaleString(),
                    },
                  ]
                : []),
            ])
          }
        } catch (error) {
          spinner.fail('Failed to fetch webhook')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
  .addCommand(
    new Command('events')
      .description('List available event types')
      .option('--format <format>', 'Output format (compact, json)', 'compact')
      .action(async (options) => {
        const spinner = ora('Fetching event types...').start()

        try {
          const client = createClient()
          const response = await client.webhooks.eventTypes()

          spinner.succeed(`Found ${response.data.length} event type(s)`)

          if (options.format === 'json') {
            formatJson(response.data)
          } else {
            // Group by category
            const byCategory: Record<string, typeof response.data> = {}
            for (const event of response.data) {
              if (!byCategory[event.category]) {
                byCategory[event.category] = []
              }
              byCategory[event.category].push(event)
            }

            console.log(chalk.bold('\nAvailable Event Types'))
            console.log(chalk.gray('─'.repeat(60)))

            for (const [category, events] of Object.entries(byCategory)) {
              console.log()
              console.log(chalk.cyan.bold(category.toUpperCase()))
              for (const event of events) {
                console.log(`  ${chalk.yellow(event.value.padEnd(30))} ${event.label}`)
              }
            }
          }
        } catch (error) {
          spinner.fail('Failed to fetch event types')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
  .addCommand(
    new Command('deliveries')
      .description('View webhook delivery history')
      .argument('<id>', 'Webhook ID')
      .option('-l, --limit <number>', 'Number of deliveries to fetch', '20')
      .option('--format <format>', 'Output format (table, json)', 'table')
      .action(async (id: string, options: Record<string, string>) => {
        const spinner = ora('Fetching deliveries...').start()

        try {
          const client = createClient()
          const response = await client.webhooks.deliveries(id, {
            limit: Number.parseInt(options.limit, 10),
          })

          spinner.succeed(`Found ${response.data.length} delivery/deliveries`)

          if (response.data.length === 0) {
            console.log(chalk.yellow('No deliveries found'))
            return
          }

          if (options.format === 'json') {
            formatJson(response.data)
          } else {
            const headers = ['ID', 'Event', 'Status', 'Response', 'Attempts', 'Delivered']
            const rows = response.data.map((delivery: Record<string, unknown>) => [
              delivery.id.slice(0, 8),
              delivery.event_type,
              delivery.status === 'success'
                ? chalk.green('Success')
                : delivery.status === 'failed'
                  ? chalk.red('Failed')
                  : chalk.yellow('Pending'),
              delivery.response_code?.toString() || 'N/A',
              delivery.attempt_count.toString(),
              delivery.delivered_at
                ? new Date(delivery.delivered_at).toLocaleString()
                : chalk.gray('Pending'),
            ])
            formatTable(headers, rows, { title: 'Webhook Deliveries' })
          }
        } catch (error) {
          spinner.fail('Failed to fetch deliveries')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
