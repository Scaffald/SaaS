import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started →
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/examples"
            style={{marginLeft: '1rem'}}>
            View Examples
          </Link>
        </div>
        <div className={styles.npmInstall}>
          <code>npm install @scaffald/sdk</code>
        </div>
      </div>
    </header>
  );
}

function Feature({title, description, icon}) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className="text--center">
        <div className={styles.featureIcon}>{icon}</div>
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title={`${siteConfig.title} - Official JavaScript/TypeScript SDK`}
      description="Official JavaScript/TypeScript SDK for the Scaffald API. Type-safe, React-ready, and production-tested.">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              <Feature
                title="Type-Safe"
                icon="📘"
                description="Full TypeScript support with auto-generated types from OpenAPI specs. Get IntelliSense and compile-time safety."
              />
              <Feature
                title="React Integration"
                icon="⚛️"
                description="Pre-built React hooks powered by TanStack Query. Automatic caching, refetching, and state management."
              />
              <Feature
                title="Production Ready"
                icon="🚀"
                description="731+ tests, 99% coverage, battle-tested in production. OAuth 2.0, webhooks, and comprehensive error handling."
              />
            </div>
          </div>
        </section>

        <section className={styles.codeExample}>
          <div className="container">
            <div className="row">
              <div className="col col--6">
                <h2>Quick Start</h2>
                <p>Get up and running in seconds with our intuitive API:</p>
              </div>
              <div className="col col--6">
                <pre className={styles.codeBlock}>
                  <code>{`import Scaffald from '@scaffald/sdk';

const client = new Scaffald({
  apiKey: 'your-api-key'
});

// List jobs
const jobs = await client.jobs.list();

// Create application
await client.applications.create({
  job_id: 'job_123',
  profile_id: 'profile_456'
});`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stats}>
          <div className="container">
            <div className="row">
              <div className="col col--3">
                <div className={styles.stat}>
                  <h3>34</h3>
                  <p>API Resources</p>
                </div>
              </div>
              <div className="col col--3">
                <div className={styles.stat}>
                  <h3>731+</h3>
                  <p>Tests Passing</p>
                </div>
              </div>
              <div className="col col--3">
                <div className={styles.stat}>
                  <h3>99%</h3>
                  <p>Code Coverage</p>
                </div>
              </div>
              <div className="col col--3">
                <div className={styles.stat}>
                  <h3>349 KB</h3>
                  <p>Bundle Size</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.getStarted}>
          <div className="container">
            <div className="text--center">
              <h2>Ready to Get Started?</h2>
              <p>Build powerful recruiting applications with Scaffald SDK</p>
              <div className={styles.buttons}>
                <Link
                  className="button button--primary button--lg"
                  to="/docs/intro">
                  Read the Docs
                </Link>
                <Link
                  className="button button--outline button--primary button--lg"
                  to="/docs/api/overview"
                  style={{marginLeft: '1rem'}}>
                  API Reference
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
