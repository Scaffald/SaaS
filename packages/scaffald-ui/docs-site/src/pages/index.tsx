import type React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';
import * as ScaffaldUI from '@scaffald/ui';

const {
  ThemeProvider,
  Button,
  Card,
  CardHeader,
  CardContent,
  Stack,
  Row,
  Text,
  Input,
  Checkbox,
  Toggle,
  Avatar,
  Chip,
  Spinner,
  Alert,
  ProgressBar,
  Skeleton,
  SkeletonText,
  Accordion,
  Separator,
} = ScaffaldUI;

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
            Get Started
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

function LiveComponentShowcase() {
  return (
    <section className={styles.componentShowcase}>
      <div className="container">
        <div className="text--center margin-bottom--lg">
          <h2>Live Component Showcase</h2>
          <p>Real Scaffald UI components rendered right here. What you see is what you get.</p>
        </div>

        <ThemeProvider initialTheme="light">
          <div className="row" style={{gap: '2rem', marginBottom: '2rem'}}>
            {/* Buttons & Inputs */}
            <div className="col col--6">
              <div className={styles.categoryCard}>
                <h4>Buttons</h4>
                <Stack gap={12}>
                  <Row gap={8} style={{flexWrap: 'wrap'}}>
                    <Button variant="filled" color="primary">Primary</Button>
                    <Button variant="outline" color="primary">Outline</Button>
                    <Button variant="light" color="primary">Light</Button>
                    <Button variant="text" color="primary">Text</Button>
                  </Row>
                  <Row gap={8} style={{flexWrap: 'wrap'}}>
                    <Button size="sm" variant="filled" color="primary">Small</Button>
                    <Button size="md" variant="filled" color="success">Medium</Button>
                    <Button size="lg" variant="filled" color="error">Large</Button>
                  </Row>
                  <Row gap={8}>
                    <Button loading variant="filled" color="primary">Loading</Button>
                    <Button disabled variant="filled" color="gray">Disabled</Button>
                  </Row>
                </Stack>
                <div style={{marginTop: 12}}>
                  <Link to="/docs/components/button">View Button docs</Link>
                </div>
              </div>
            </div>

            {/* Form Controls */}
            <div className="col col--6">
              <div className={styles.categoryCard}>
                <h4>Form Controls</h4>
                <Stack gap={12}>
                  <Input label="Email" placeholder="you@example.com" />
                  <Row gap={16} style={{alignItems: 'center', flexWrap: 'wrap'}}>
                    <Checkbox label="Remember me" />
                    <Toggle label="Dark mode" size="sm" />
                  </Row>
                </Stack>
                <div style={{marginTop: 12}}>
                  <Link to="/docs/components/input">View Input docs</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="row" style={{gap: '2rem', marginBottom: '2rem'}}>
            {/* Feedback */}
            <div className="col col--6">
              <div className={styles.categoryCard}>
                <h4>Feedback</h4>
                <Stack gap={12}>
                  <Alert type="info" title="Informational message for the user." />
                  <Alert type="success" title="Operation completed successfully!" />
                  <Alert type="warning" title="Please review before continuing." />
                  <Row gap={12} style={{alignItems: 'center'}}>
                    <Spinner size="sm" />
                    <ProgressBar value={72} />
                  </Row>
                </Stack>
                <div style={{marginTop: 12}}>
                  <Link to="/docs/components/alert">View Alert docs</Link>
                </div>
              </div>
            </div>

            {/* Data Display */}
            <div className="col col--6">
              <div className={styles.categoryCard}>
                <h4>Data Display</h4>
                <Stack gap={12}>
                  <Row gap={8} style={{alignItems: 'center'}}>
                    <Avatar initials="JD" size={40} color="primary" />
                    <Avatar initials="AB" size={40} color="success" />
                    <Avatar initials="XY" size={40} color="error" />
                    <Avatar initials="MN" size={40} color="warning" />
                  </Row>
                  <Row gap={8} style={{flexWrap: 'wrap'}}>
                    <Chip>React Native</Chip>
                    <Chip selected>TypeScript</Chip>
                    <Chip>Expo</Chip>
                    <Chip>Cross-Platform</Chip>
                  </Row>
                  <SkeletonText lines={3} />
                </Stack>
                <div style={{marginTop: 12}}>
                  <Link to="/docs/components/avatar">View Avatar docs</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="row" style={{gap: '2rem'}}>
            {/* Cards */}
            <div className="col col--6">
              <div className={styles.categoryCard}>
                <h4>Cards</h4>
                <Stack gap={12}>
                  <Card variant="elevated" padding="md">
                    <CardHeader title="Elevated Card" subtitle="With shadow" />
                    <CardContent>
                      <Text>Cards group related content with flexible styling options.</Text>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" padding="md">
                    <CardContent>
                      <Text weight="bold">Outlined Card</Text>
                      <Text>Clean bordered style for subtle containers.</Text>
                    </CardContent>
                  </Card>
                </Stack>
                <div style={{marginTop: 12}}>
                  <Link to="/docs/components/card">View Card docs</Link>
                </div>
              </div>
            </div>

            {/* Accordion */}
            <div className="col col--6">
              <div className={styles.categoryCard}>
                <h4>Accordion</h4>
                <Accordion defaultValue="item1">
                  <Accordion.Item value="item1">
                    <Accordion.Trigger>What is Scaffald UI?</Accordion.Trigger>
                    <Accordion.Content>
                      <Text>A production-ready component library for React Native and Web with 90+ components.</Text>
                    </Accordion.Content>
                  </Accordion.Item>
                  <Accordion.Item value="item2">
                    <Accordion.Trigger>Is it cross-platform?</Accordion.Trigger>
                    <Accordion.Content>
                      <Text>Yes! Single codebase for iOS, Android, and Web via Expo.</Text>
                    </Accordion.Content>
                  </Accordion.Item>
                  <Accordion.Item value="item3">
                    <Accordion.Trigger>Does it support theming?</Accordion.Trigger>
                    <Accordion.Content>
                      <Text>Full light/dark mode with semantic color tokens and a ThemeProvider.</Text>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion>
                <div style={{marginTop: 12}}>
                  <Link to="/docs/components/accordion">View Accordion docs</Link>
                </div>
              </div>
            </div>
          </div>
        </ThemeProvider>
      </div>
    </section>
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

export default function Home(): React.ReactElement {
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

        <LiveComponentShowcase />

        <section className={styles.codeExample}>
          <div className="container">
            <div className="row">
              <div className="col col--6">
                <h2>Quick Start</h2>
                <p>Beautiful, accessible components in minutes:</p>
              </div>
              <div className="col col--6">
                <pre className={styles.codeBlock}>
                  <code>{`import { Button, Stack, Input } from '@scaffald/ui';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');

  return (
    <Stack gap={16}>
      <Input
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
