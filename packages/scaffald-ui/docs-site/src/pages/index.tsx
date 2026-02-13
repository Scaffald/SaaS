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
            to="/docs/guide/quick-start">
            Get Started →
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/components/overview"
            style={{marginLeft: '1rem'}}>
            Browse Components
          </Link>
        </div>
        <div className={styles.npmInstall}>
          <code>npm install @scaffald/ui react react-native</code>
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
      title={`${siteConfig.title} - Production-Ready UI for Expo`}
      description="Best-in-class UI framework for Expo (React Native + Web). 90+ production-ready components with comprehensive theming and TypeScript support.">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              <Feature
                title="90+ Components"
                icon="🎨"
                description="Complete UI toolkit from buttons to complex data visualizations. Built from the Forsured Design System with consistent APIs."
              />
              <Feature
                title="Cross-Platform"
                icon="🌐"
                description="Single codebase works seamlessly on iOS, Android, and Web. Optimized inline styles deliver maximum performance."
              />
              <Feature
                title="Type-Safe"
                icon="📘"
                description="Full TypeScript support with IntelliSense everywhere. Comprehensive theme system with light/dark mode built-in."
              />
            </div>
          </div>
        </section>

        <section className={styles.codeExample}>
          <div className="container">
            <div className="row">
              <div className="col col--6">
                <h2>Quick Start</h2>
                <p>Beautiful, accessible components in minutes:</p>
              </div>
              <div className="col col--6">
                <pre className={styles.codeBlock}>
                  <code>{`import { Button, Stack, TextInput } from '@scaffald/ui';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');

  return (
    <Stack gap={16}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />
      <Button variant="filled" color="primary">
        Sign In
      </Button>
    </Stack>
  );
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.componentShowcase}>
          <div className="container">
            <div className="text--center margin-bottom--lg">
              <h2>Component Categories</h2>
              <p>Explore our comprehensive library organized by use case</p>
            </div>
            <div className="row">
              <div className="col col--3">
                <div className={styles.categoryCard}>
                  <h4>📝 Forms</h4>
                  <p>Button, TextInput, Checkbox, Radio, Select, Slider, DatePicker</p>
                  <Link to="/docs/components/button">Explore →</Link>
                </div>
              </div>
              <div className="col col--3">
                <div className={styles.categoryCard}>
                  <h4>📐 Layout</h4>
                  <p>Stack, Row, Container, Grid, Divider, Spacer</p>
                  <Link to="/docs/components/overview">Explore →</Link>
                </div>
              </div>
              <div className="col col--3">
                <div className={styles.categoryCard}>
                  <h4>💬 Feedback</h4>
                  <p>Alert, Toast, Modal, Progress, Spinner, Skeleton, Badge</p>
                  <Link to="/docs/components/alert">Explore →</Link>
                </div>
              </div>
              <div className="col col--3">
                <div className={styles.categoryCard}>
                  <h4>📊 Data</h4>
                  <p>Card, Table, List, Avatar, Chart, Icon</p>
                  <Link to="/docs/components/card">Explore →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stats}>
          <div className="container">
            <div className="row">
              <div className="col col--3">
                <div className={styles.stat}>
                  <h3>90+</h3>
                  <p>Components</p>
                </div>
              </div>
              <div className="col col--3">
                <div className={styles.stat}>
                  <h3>1,196</h3>
                  <p>Active Imports</p>
                </div>
              </div>
              <div className="col col--3">
                <div className={styles.stat}>
                  <h3>100%</h3>
                  <p>TypeScript</p>
                </div>
              </div>
              <div className="col col--3">
                <div className={styles.stat}>
                  <h3>1.7 MB</h3>
                  <p>Package Size</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.getStarted}>
          <div className="container">
            <div className="text--center">
              <h2>Ready to Build?</h2>
              <p>Create beautiful mobile and web apps with Scaffald UI</p>
              <div className={styles.buttons}>
                <Link
                  className="button button--primary button--lg"
                  to="/docs/guide/installation">
                  Installation Guide
                </Link>
                <Link
                  className="button button--outline button--primary button--lg"
                  to="/docs/guide/theming"
                  style={{marginLeft: '1rem'}}>
                  Theming Guide
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
