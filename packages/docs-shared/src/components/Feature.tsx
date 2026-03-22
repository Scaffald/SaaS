import React from 'react';
import clsx from 'clsx';
import styles from './Feature.module.css';

interface FeatureProps {
  title: string;
  description: string;
  icon: string;
}

export function Feature({ title, description, icon }: FeatureProps) {
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
