#!/usr/bin/env node
import { randomUUID } from 'node:crypto'

const endpoint = process.env.CHAOS_LATENCY_ENDPOINT
const token = process.env.CHAOS_LATENCY_TOKEN
const latencyMs = process.env.CHAOS_LATENCY_MS || '250'
const runId = process.env.RUN_ID || randomUUID()

if (!endpoint) {
  console.log('⚠️  No CHAOS_LATENCY_ENDPOINT configured, skipping latency toggle')
  process.exit(0)
}

const url = new URL(endpoint)
url.searchParams.set('latency', latencyMs)
url.searchParams.set('runId', runId)

const headers = { 'Content-Type': 'application/json' }
if (token) headers['Authorization'] = `Bearer ${token}`

const response = await fetch(url, {
  method: 'POST',
  headers,
  body: JSON.stringify({ latency: Number(latencyMs), runId }),
})

if (!response.ok) {
  const body = await response.text()
  console.error(body)
  throw new Error(`Failed to toggle latency (${response.status})`)
}

console.log(`Injected ${latencyMs}ms latency for run ${runId}`)
