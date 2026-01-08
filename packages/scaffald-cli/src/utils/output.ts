/**
 * Output Formatting Utilities
 * Format data for CLI display (tables, JSON, etc.)
 */

import Table from 'cli-table3'
import chalk from 'chalk'

export type OutputFormat = 'table' | 'json' | 'compact'

export function formatTable(
  headers: string[],
  rows: string[][],
  options?: {
    title?: string
  }
): void {
  const table = new Table({
    head: headers.map((h) => chalk.cyan(h)),
    style: {
      head: [],
      border: [],
    },
  })

  for (const row of rows) {
    table.push(row)
  }

  if (options?.title) {
    console.log(chalk.bold(options.title))
    console.log()
  }

  console.log(table.toString())
}

export function formatJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

export function formatCompact(items: Array<{ label: string; value: string }>): void {
  const maxLabelLength = Math.max(...items.map((i) => i.label.length))

  for (const item of items) {
    const paddedLabel = item.label.padEnd(maxLabelLength)
    console.log(chalk.cyan(paddedLabel), item.value)
  }
}

export function formatSuccess(message: string): void {
  console.log(chalk.green('✓'), message)
}

export function formatError(message: string): void {
  console.error(chalk.red('✗'), message)
}

export function formatWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message)
}

export function formatInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message)
}
