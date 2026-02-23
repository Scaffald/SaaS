/**
 * Jobs Commands
 * List, view, create, update, and delete jobs
 */

import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import type { Job } from '@scaffald/sdk'
import { createClient } from '../utils/client.js'
import { formatTable, formatJson, formatCompact } from '../utils/output.js'

type JobLocation = Job['location']
const formatLocation = (location: JobLocation): string => {
  if (!location) return 'Remote'
  if (typeof location === 'string') return location || 'Remote'
  return [location.city, location.state, location.country].filter(Boolean).join(', ') || 'Remote'
}

export const jobsCommand = new Command('jobs')
  .description('Manage jobs')
  .addCommand(
    new Command('list')
      .description('List jobs')
      .option('-l, --limit <number>', 'Number of jobs to fetch', '20')
      .option('--status <status>', 'Filter by status (draft, published, closed)')
      .option('--format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        const spinner = ora('Fetching jobs...').start()

        try {
          const client = createClient()
          const response = await client.jobs.list({
            limit: Number.parseInt(options.limit, 10),
            ...(options.status && { status: options.status }),
          })

          spinner.succeed(`Found ${response.data.length} job(s)`)

          if (response.data.length === 0) {
            console.log(chalk.yellow('No jobs found'))
            return
          }

          if (options.format === 'json') {
            formatJson(response.data)
          } else {
            const headers = ['ID', 'Title', 'Organization', 'Status', 'Type', 'Location']
            const rows = response.data.map((job: Job) => [
              job.id.slice(0, 8),
              job.title,
              job.organization_id || 'N/A',
              job.status,
              job.employment_type || 'N/A',
              formatLocation(job.location),
            ])
            formatTable(headers, rows, { title: 'Jobs' })
          }
        } catch (error) {
          spinner.fail('Failed to fetch jobs')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
  .addCommand(
    new Command('view')
      .description('View job details')
      .argument('<id>', 'Job ID')
      .option('--format <format>', 'Output format (compact, json)', 'compact')
      .action(async (id: string, options: Record<string, string>) => {
        const spinner = ora('Fetching job...').start()

        try {
          const client = createClient()
          const job = await client.jobs.retrieve(id)

          spinner.succeed('Job fetched')

          if (options.format === 'json') {
            formatJson(job)
          } else {
            console.log(chalk.bold.cyan(`\n${job.title}`))
            console.log(chalk.gray('─'.repeat(60)))
            console.log()

            formatCompact([
              { label: 'ID:', value: job.id },
              { label: 'Status:', value: job.status },
              { label: 'Organization:', value: job.organization_id || 'N/A' },
              { label: 'Employment Type:', value: job.employment_type || 'N/A' },
              { label: 'Location:', value: formatLocation(job.location) },
              ...(job.salary_min && job.salary_max
                ? [
                    {
                      label: 'Salary Range:',
                      value: `$${job.salary_min} - $${job.salary_max}`,
                    },
                  ]
                : []),
              { label: 'Created:', value: new Date(job.created_at).toLocaleDateString() },
              ...(job.published_at
                ? [{ label: 'Published:', value: new Date(job.published_at).toLocaleDateString() }]
                : []),
            ])

            if (job.description) {
              console.log()
              console.log(chalk.bold('Description:'))
              console.log(job.description)
            }
          }
        } catch (error) {
          spinner.fail('Failed to fetch job')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
  .addCommand(
    new Command('similar')
      .description('Find similar jobs')
      .argument('<id>', 'Job ID')
      .option('-l, --limit <number>', 'Number of similar jobs to fetch', '10')
      .option('--format <format>', 'Output format (table, json)', 'table')
      .action(async (id: string, options: Record<string, string>) => {
        const spinner = ora('Finding similar jobs...').start()

        try {
          const client = createClient()
          const response = await client.jobs.similar(id, Number.parseInt(options.limit, 10))

          spinner.succeed(`Found ${response.data.length} similar job(s)`)

          if (response.data.length === 0) {
            console.log(chalk.yellow('No similar jobs found'))
            return
          }

          if (options.format === 'json') {
            formatJson(response.data)
          } else {
            const headers = ['ID', 'Title', 'Organization', 'Type', 'Location']
            const rows = response.data.map((job: Job) => [
              job.id.slice(0, 8),
              job.title,
              job.organization_id || 'N/A',
              job.employment_type || 'N/A',
              formatLocation(job.location),
            ])
            formatTable(headers, rows, { title: 'Similar Jobs' })
          }
        } catch (error) {
          spinner.fail('Failed to fetch similar jobs')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
  .addCommand(
    new Command('filters')
      .description('Get available filter options')
      .option('--format <format>', 'Output format (compact, json)', 'compact')
      .action(async (options) => {
        const spinner = ora('Fetching filter options...').start()

        try {
          const client = createClient()
          const filters = await client.jobs.filterOptions()

          spinner.succeed('Filter options fetched')

          if (options.format === 'json') {
            formatJson(filters)
          } else {
            console.log(chalk.bold('\nAvailable Filters'))
            console.log(chalk.gray('─'.repeat(60)))
            console.log()

            if (filters.employmentTypes?.length) {
              console.log(chalk.cyan('Employment Types:'))
              console.log(filters.employmentTypes.join(', '))
              console.log()
            }

            if (filters.remoteOptions?.length) {
              console.log(chalk.cyan('Remote Options:'))
              console.log(filters.remoteOptions.join(', '))
              console.log()
            }

            if (filters.locations?.length) {
              console.log(chalk.cyan('Locations:'))
              console.log(filters.locations.slice(0, 20).join(', '))
              if (filters.locations.length > 20) {
                console.log(chalk.gray(`... and ${filters.locations.length - 20} more`))
              }
            }
          }
        } catch (error) {
          spinner.fail('Failed to fetch filter options')
          if (error instanceof Error) {
            console.error(chalk.red(error.message))
          }
          process.exit(1)
        }
      })
  )
