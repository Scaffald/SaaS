/**
 * Incident Severity Level Definitions
 * Incident Response Plan & Procedures
 */

import { SeverityLevel } from './types';

/**
 * Severity level configurations with response times and escalation
 */
export const SEVERITY_LEVELS: Record<string, SeverityLevel> = {
  P0: {
    level: 'P0',
    name: 'Critical',
    description:
      'Active breach with confirmed data exfiltration, complete system compromise, or ongoing attack affecting production systems',
    examples: [
      'Active data breach with confirmed PII exfiltration',
      'Ransomware encryption of production systems',
      'Complete system outage affecting all users',
      'Ongoing unauthorized access to customer data',
      'Database compromise with data deletion',
      'Successful privilege escalation attack',
    ],
    responseTimeMinutes: 15,
    escalationContacts: ['ceo', 'cto', 'legal_counsel', 'security_lead'],
    requiresPostMortem: true,
  },
  P1: {
    level: 'P1',
    name: 'High',
    description:
      'Suspected breach, unauthorized access detected, or significant vulnerability exploitation with potential for data loss',
    examples: [
      'Suspected unauthorized access to production systems',
      'DDoS attack causing service degradation',
      'Critical vulnerability being actively exploited',
      'Malware detected on production servers',
      'Unauthorized API access attempts succeeding',
      'Insider threat indicators detected',
    ],
    responseTimeMinutes: 60,
    escalationContacts: ['cto', 'security_lead', 'devops_lead'],
    requiresPostMortem: true,
  },
  P2: {
    level: 'P2',
    name: 'Medium',
    description:
      'Security policy violations, failed intrusion attempts, or vulnerabilities requiring prompt remediation',
    examples: [
      'Failed authentication spike (potential brute force)',
      'Security policy violation by employee',
      'High-severity vulnerability discovered (not yet exploited)',
      'Suspicious log patterns requiring investigation',
      'Failed intrusion attempts blocked by firewall',
      'Minor data exposure (non-PII)',
    ],
    responseTimeMinutes: 240, // 4 hours
    escalationContacts: ['security_lead', 'devops_lead'],
    requiresPostMortem: false,
  },
  P3: {
    level: 'P3',
    name: 'Low',
    description: 'Minor security anomalies, policy deviations, or informational security events',
    examples: [
      'Security scan alerts (false positives)',
      'Minor policy deviations',
      'Informational security events',
      'Low-severity vulnerabilities discovered',
      'Security tool misconfigurations',
      'User security awareness issues',
    ],
    responseTimeMinutes: 1440, // 24 hours
    escalationContacts: ['security_lead'],
    requiresPostMortem: false,
  },
};

/**
 * Get severity level configuration
 */
export function getSeverityLevel(severity: string): SeverityLevel | undefined {
  return SEVERITY_LEVELS[severity];
}

/**
 * Validate if response is within target time
 */
export function isWithinResponseTime(
  severity: string,
  detectedAt: Date,
  respondedAt: Date
): boolean {
  const level = getSeverityLevel(severity);
  if (!level) return false;

  const responseTimeMs = (respondedAt.getTime() - detectedAt.getTime()) / 1000 / 60;
  return responseTimeMs <= level.responseTimeMinutes;
}

/**
 * Get all severity levels sorted by priority
 */
export function getAllSeverityLevels(): SeverityLevel[] {
  return Object.values(SEVERITY_LEVELS);
}

/**
 * Check if severity requires post-mortem
 */
export function requiresPostMortem(severity: string): boolean {
  const level = getSeverityLevel(severity);
  return level?.requiresPostMortem ?? false;
}
