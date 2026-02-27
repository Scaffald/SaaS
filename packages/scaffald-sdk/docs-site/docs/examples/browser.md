---
title: Browser Examples
---

# Browser Examples

Examples of using the Scaffald SDK in browser applications.

## CDN Usage

```html
<!DOCTYPE html>
<html>
<head>
  <title>Scaffald SDK Example</title>
  <script src="https://unpkg.com/@scaffald/sdk"></script>
</head>
<body>
  <div id="jobs"></div>

  <script>
    const client = new Scaffald.default({
      apiKey: 'scf_your_api_key_here',
    });

    async function loadJobs() {
      const jobs = await client.jobs.list();
      const container = document.getElementById('jobs');
      
      jobs.data.forEach(job => {
        const div = document.createElement('div');
        div.innerHTML = `<h3>${job.title}</h3><p>${job.company_name}</p>`;
        container.appendChild(div);
      });
    }

    loadJobs();
  </script>
</body>
</html>
```

## Vanilla JavaScript

```javascript
// app.js
import Scaffald from '@scaffald/sdk';

const client = new Scaffald({
  apiKey: 'scf_your_api_key_here',
});

document.getElementById('searchBtn').addEventListener('click', async () => {
  const query = document.getElementById('searchInput').value;
  const jobs = await client.jobs.search({ query });
  displayJobs(jobs.data);
});

function displayJobs(jobs) {
  const container = document.getElementById('results');
  container.innerHTML = jobs.map(job => `
    <div class="job-card">
      <h3>${job.title}</h3>
      <p>${job.company_name}</p>
      <button onclick="applyToJob('${job.id}')">Apply</button>
    </div>
  `).join('');
}
```

## With Build Tools (Vite, Webpack)

```javascript
// main.js
import Scaffald from '@scaffald/sdk';
import './style.css';

const client = new Scaffald({
  apiKey: import.meta.env.VITE_SCAFFALD_API_KEY,
});

async function init() {
  const jobs = await client.jobs.list({ per_page: 10 });
  renderJobs(jobs.data);
}

init();
```
