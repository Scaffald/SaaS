---
title: Node.js Examples
---

# Node.js Examples

Examples of using the Scaffald SDK in Node.js applications.

## Basic Server Setup

```javascript
// server.js
import Scaffald from '@scaffald/sdk';
import express from 'express';

const app = express();
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY,
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await client.jobs.list();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Environment Variables

```bash
# .env
SCAFFALD_API_KEY=scf_your_api_key_here
SCAFFALD_BASE_URL=https://api.scaffald.com
```

```javascript
// config.js
import 'dotenv/config';

export const scaffaldClient = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY,
  baseURL: process.env.SCAFFALD_BASE_URL,
});
```

## Error Handling

```javascript
import { ScaffaldError, ValidationError } from '@scaffald/sdk';

async function createJob(jobData) {
  try {
    const job = await client.jobs.create(jobData);
    return { success: true, job };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        errors: error.errors,
      };
    }
    if (error instanceof ScaffaldError) {
      console.error('API Error:', error.statusCode, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
    throw error; // Unexpected error
  }
}
```

For more examples, check the [examples directory](https://github.com/Scaffald/sdk/tree/main/examples) in the repository.
