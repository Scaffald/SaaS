#!/usr/bin/env node

/**
 * Scaffald CLI
 * Command-line interface for interacting with the Scaffald API
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { authCommand } from './commands/auth.js'
import { jobsCommand } from './commands/jobs.js'
import { webhooksCommand } from './commands/webhooks.js'
import { keysCommand } from './commands/keys.js'
import { configCommand } from './commands/config.js'

const program = new Command()

program
  .name('scaffald')
  .description('CLI tool for interacting with the Scaffald API')
  .version('0.1.0')
  .option('-k, --api-key <key>', 'API key for authentication')
  .option('--base-url <url>', 'Base URL for API (default: https://api.scaffald.com)')

// Commands
program.addCommand(authCommand)
program.addCommand(jobsCommand)
program.addCommand(webhooksCommand)
program.addCommand(keysCommand)
program.addCommand(configCommand)

// Error handling
program.exitOverride()

try {
  await program.parseAsync(process.argv)
} catch (error) {
  if (error instanceof Error) {
    console.error(chalk.red('Error:'), error.message)
    process.exit(1)
  }
}
