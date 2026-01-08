# Scaffald CLI

Command-line interface for interacting with the Scaffald API.

## Installation

```bash
# Global installation
npm install -g @scaffald/cli

# Or use with npx
npx @scaffald/cli
```

## Quick Start

1. **Login with your API key:**

```bash
scaffald auth login
# Enter your API key when prompted
```

2. **Set your organization (optional but recommended):**

```bash
scaffald config set org <your-organization-id>
```

3. **List jobs:**

```bash
scaffald jobs list
```

## Commands

### Authentication

```bash
# Login with API key
scaffald auth login
scaffald auth login --key sk_live_...

# Check authentication status
scaffald auth status

# Logout
scaffald auth logout
```

### Configuration

```bash
# Show current configuration
scaffald config show

# Set configuration values
scaffald config set api-key sk_live_...
scaffald config set base-url https://api.scaffald.com
scaffald config set org org_123...

# Clear all configuration
scaffald config clear
```

### Jobs

```bash
# List jobs
scaffald jobs list
scaffald jobs list --limit 50
scaffald jobs list --status published
scaffald jobs list --format json

# View job details
scaffald jobs view <job-id>
scaffald jobs view <job-id> --format json

# Find similar jobs
scaffald jobs similar <job-id>
scaffald jobs similar <job-id> --limit 5

# Get filter options
scaffald jobs filters
```

### API Keys

```bash
# List API keys (requires organization ID)
scaffald keys list
scaffald keys list --org <organization-id>

# View API key details
scaffald keys view <key-id>

# View API key usage statistics
scaffald keys usage <key-id>
scaffald keys usage <key-id> --days 30
```

### Webhooks

```bash
# List webhooks (requires organization ID)
scaffald webhooks list
scaffald webhooks list --org <organization-id>

# View webhook details
scaffald webhooks view <webhook-id>

# List available event types
scaffald webhooks events

# View webhook delivery history
scaffald webhooks deliveries <webhook-id>
scaffald webhooks deliveries <webhook-id> --limit 50
```

## Output Formats

Most commands support multiple output formats:

- `table` (default): Human-readable table format
- `json`: JSON output for programmatic use
- `compact`: Compact key-value format

```bash
# Table format (default)
scaffald jobs list

# JSON format
scaffald jobs list --format json

# Compact format
scaffald jobs view <job-id> --format compact
```

## Global Options

All commands support these global options:

```bash
-k, --api-key <key>    # Override configured API key
--base-url <url>       # Override configured base URL
```

Example:

```bash
scaffald jobs list --api-key sk_live_... --base-url https://api.staging.scaffald.com
```

## Configuration Storage

Configuration is stored in:

- **macOS**: `~/Library/Preferences/scaffald-cli/config.json`
- **Linux**: `~/.config/scaffald-cli/config.json`
- **Windows**: `%APPDATA%\scaffald-cli\Config\config.json`

## Examples

### Get started with the CLI

```bash
# Login
scaffald auth login

# Set your organization
scaffald config set org org_abc123

# List all published jobs
scaffald jobs list --status published

# View job details
scaffald jobs view job_xyz789

# Find similar jobs
scaffald jobs similar job_xyz789 --limit 10
```

### Monitor API key usage

```bash
# List all API keys
scaffald keys list

# View usage for a specific key
scaffald keys usage key_123 --days 30

# Get detailed statistics in JSON
scaffald keys usage key_123 --days 7 --format json
```

### Manage webhooks

```bash
# List all webhooks
scaffald webhooks list

# View webhook details
scaffald webhooks view webhook_123

# Check delivery history
scaffald webhooks deliveries webhook_123

# List available event types
scaffald webhooks events
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development
pnpm dev

# Run locally
node dist/index.js

# Link for local testing
pnpm link --global
```

## License

MIT
