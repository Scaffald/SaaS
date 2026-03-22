import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './HomepageHeader.module.css';

interface HomepageHeaderProps {
  primaryCTA: { label: string; href: string };
  secondaryCTA: { label: string; href: string };
  npmCommand: string;
}

export function HomepageHeader({ primaryCTA, secondaryCTA, npmCommand }: HomepageHeaderProps) {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to={primaryCTA.href}>
            {primaryCTA.label}
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to={secondaryCTA.href}
            style={{ marginLeft: '1rem' }}>
            {secondaryCTA.label}
          </Link>
        </div>
        <div className={styles.npmInstall}>
          <code>{npmCommand}</code>
        </div>
      </div>
    </header>
  );
}
