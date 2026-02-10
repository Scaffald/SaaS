/**
 * Incident Tracker Tests
 * Incident Response Plan & Procedures
 * Following TDD principles from
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createIncident,
  updateIncident,
  getIncident,
  getAllIncidents,
  addTimelineEvent,
  getIncidentTimeline,
  closeIncident,
  escalateIncident,
  clearAllIncidents,
} from '../incidentTracker';
import { IncidentSeverity, IncidentStatus, IncidentType } from '../types';

describe('Incident Tracker', () => {
  beforeEach(() => {
    // Clear any test data before each test
    clearAllIncidents();
  });

  describe('createIncident', () => {
    it('should create a new incident with required fields', () => {
      const input = {
        severity: 'P1' as IncidentSeverity,
        type: 'data_breach' as IncidentType,
        title: 'Unauthorized database access detected',
        description: 'Multiple failed auth attempts followed by successful login',
        detectedBy: 'security-monitor',
        affectedSystems: ['database-prod'],
      };

      const incident = createIncident(input);

      expect(incident).toBeDefined();
      expect(incident.id).toMatch(/^INC-\d{4}-\d{3}$/); // Format: INC-2025-001
      expect(incident.severity).toBe('P1');
      expect(incident.type).toBe('data_breach');
      expect(incident.status).toBe('detected');
      expect(incident.title).toBe(input.title);
      expect(incident.description).toBe(input.description);
      expect(incident.detectedBy).toBe('security-monitor');
      expect(incident.affectedSystems).toEqual(['database-prod']);
      expect(incident.timeline).toHaveLength(1); // Initial detection event
      expect(incident.timeline[0].type).toBe('detection');
      expect(incident.createdAt).toBeDefined();
      expect(incident.updatedAt).toBeDefined();
    });

    it('should create incident with minimal required fields', () => {
      const input = {
        severity: 'P3' as IncidentSeverity,
        type: 'other' as IncidentType,
        title: 'Security scan alert',
        description: 'Routine security scan detected anomaly',
        detectedBy: 'automated-scan',
      };

      const incident = createIncident(input);

      expect(incident).toBeDefined();
      expect(incident.affectedSystems).toEqual([]);
      expect(incident.affectedUsers).toEqual([]);
      expect(incident.metadata).toEqual({});
    });

    it('should generate unique incident IDs', () => {
      const input = {
        severity: 'P2' as IncidentSeverity,
        type: 'phishing' as IncidentType,
        title: 'Phishing attempt detected',
        description: 'Suspicious email reported',
        detectedBy: 'user-report',
      };

      const incident1 = createIncident(input);
      const incident2 = createIncident(input);

      expect(incident1.id).not.toBe(incident2.id);
    });

    it('should validate severity level', () => {
      const input = {
        severity: 'P5' as IncidentSeverity, // Invalid severity
        type: 'other' as IncidentType,
        title: 'Test incident',
        description: 'Test',
        detectedBy: 'test',
      };

      expect(() => createIncident(input)).toThrow('Invalid severity level');
    });
  });

  describe('updateIncident', () => {
    it('should update incident status', async () => {
      const incident = createIncident({
        severity: 'P1' as IncidentSeverity,
        type: 'unauthorized_access' as IncidentType,
        title: 'Unauthorized access attempt',
        description: 'Failed auth spike detected',
        detectedBy: 'monitor',
      });

      // Small delay to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = updateIncident(incident.id, {
        status: 'investigating' as IncidentStatus,
      });

      expect(updated.status).toBe('investigating');
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(incident.updatedAt).getTime()
      );
    });

    it('should update incident severity and escalate', () => {
      const incident = createIncident({
        severity: 'P2' as IncidentSeverity,
        type: 'vulnerability_exploit' as IncidentType,
        title: 'Vulnerability discovered',
        description: 'CVE-2025-12345',
        detectedBy: 'security-scan',
      });

      const updated = updateIncident(incident.id, {
        severity: 'P1' as IncidentSeverity,
      });

      expect(updated.severity).toBe('P1');
      expect(updated.timeline).toContainEqual(
        expect.objectContaining({
          type: 'escalation',
          description: expect.stringContaining('P2 to P1'),
        })
      );
    });

    it('should update assigned owner', () => {
      const incident = createIncident({
        severity: 'P1' as IncidentSeverity,
        type: 'malware' as IncidentType,
        title: 'Malware detected',
        description: 'Suspicious file found',
        detectedBy: 'antivirus',
      });

      const updated = updateIncident(incident.id, {
        assignedTo: 'security-engineer-1',
      });

      expect(updated.assignedTo).toBe('security-engineer-1');
    });

    it('should throw error for non-existent incident', () => {
      expect(() =>
        updateIncident('INC-9999-999', { status: 'contained' as IncidentStatus })
      ).toThrow('Incident not found');
    });
  });

  describe('addTimelineEvent', () => {
    it('should add action event to incident timeline', () => {
      const incident = createIncident({
        severity: 'P0' as IncidentSeverity,
        type: 'ransomware' as IncidentType,
        title: 'Ransomware attack detected',
        description: 'Files being encrypted',
        detectedBy: 'edr-system',
      });

      const event = addTimelineEvent({
        incidentId: incident.id,
        type: 'action',
        description: 'Isolated affected systems from network',
        actor: 'devops-engineer',
        evidence: ['logs/isolation-command.log'],
      });

      expect(event).toBeDefined();
      expect(event.type).toBe('action');
      expect(event.actor).toBe('devops-engineer');
      expect(event.evidence).toContain('logs/isolation-command.log');

      const timeline = getIncidentTimeline(incident.id);
      expect(timeline).toHaveLength(2); // Detection + Action
      expect(timeline[1]).toEqual(event);
    });

    it('should add communication event to timeline', () => {
      const incident = createIncident({
        severity: 'P1' as IncidentSeverity,
        type: 'data_breach' as IncidentType,
        title: 'Customer data exposed',
        description: 'API vulnerability exploited',
        detectedBy: 'security-team',
      });

      const event = addTimelineEvent({
        incidentId: incident.id,
        type: 'communication',
        description: 'Notified legal counsel of breach',
        actor: 'incident-commander',
        evidence: ['emails/legal-notification.eml'],
        metadata: { recipientEmail: 'legal@company.com' },
      });

      expect(event.metadata).toEqual({ recipientEmail: 'legal@company.com' });
    });

    it('should maintain chronological order', () => {
      const incident = createIncident({
        severity: 'P2' as IncidentSeverity,
        type: 'ddos' as IncidentType,
        title: 'DDoS attack in progress',
        description: 'Traffic spike detected',
        detectedBy: 'cdn-monitor',
      });

      addTimelineEvent({
        incidentId: incident.id,
        type: 'action',
        description: 'Enabled DDoS protection',
        actor: 'devops',
      });

      addTimelineEvent({
        incidentId: incident.id,
        type: 'discovery',
        description: 'Identified attack source',
        actor: 'security',
      });

      const timeline = getIncidentTimeline(incident.id);
      expect(timeline).toHaveLength(3);

      // Verify chronological order
      for (let i = 1; i < timeline.length; i++) {
        const prev = new Date(timeline[i - 1].timestamp);
        const curr = new Date(timeline[i].timestamp);
        expect(curr.getTime()).toBeGreaterThanOrEqual(prev.getTime());
      }
    });
  });

  describe('getIncident', () => {
    it('should retrieve existing incident', () => {
      const created = createIncident({
        severity: 'P1' as IncidentSeverity,
        type: 'insider_threat' as IncidentType,
        title: 'Suspicious employee activity',
        description: 'Unusual data access patterns',
        detectedBy: 'dlp-system',
      });

      const retrieved = getIncident(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent incident', () => {
      const incident = getIncident('INC-9999-999');
      expect(incident).toBeNull();
    });
  });

  describe('getAllIncidents', () => {
    it('should retrieve all incidents', () => {
      createIncident({
        severity: 'P0' as IncidentSeverity,
        type: 'data_breach' as IncidentType,
        title: 'Major breach',
        description: 'Critical incident',
        detectedBy: 'system',
      });

      createIncident({
        severity: 'P3' as IncidentSeverity,
        type: 'other' as IncidentType,
        title: 'Minor alert',
        description: 'Low priority',
        detectedBy: 'scan',
      });

      const incidents = getAllIncidents();
      expect(incidents.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter incidents by severity', () => {
      createIncident({
        severity: 'P0' as IncidentSeverity,
        type: 'data_breach' as IncidentType,
        title: 'Critical',
        description: 'P0 incident',
        detectedBy: 'system',
      });

      createIncident({
        severity: 'P1' as IncidentSeverity,
        type: 'malware' as IncidentType,
        title: 'High priority',
        description: 'P1 incident',
        detectedBy: 'system',
      });

      const criticalIncidents = getAllIncidents({ severity: 'P0' });
      expect(criticalIncidents.every((inc) => inc.severity === 'P0')).toBe(true);
    });

    it('should filter incidents by status', () => {
      const incident = createIncident({
        severity: 'P2' as IncidentSeverity,
        type: 'phishing' as IncidentType,
        title: 'Phishing email',
        description: 'Reported by user',
        detectedBy: 'user',
      });

      updateIncident(incident.id, { status: 'resolved' as IncidentStatus });

      const resolvedIncidents = getAllIncidents({ status: 'resolved' });
      expect(resolvedIncidents.some((inc) => inc.id === incident.id)).toBe(true);
    });
  });

  describe('closeIncident', () => {
    it('should close an incident and set timestamps', () => {
      const incident = createIncident({
        severity: 'P2' as IncidentSeverity,
        type: 'vulnerability_exploit' as IncidentType,
        title: 'Vulnerability patched',
        description: 'Security update applied',
        detectedBy: 'security',
      });

      updateIncident(incident.id, { status: 'resolved' as IncidentStatus });
      const closed = closeIncident(incident.id, 'security-lead');

      expect(closed.status).toBe('closed');
      expect(closed.closedAt).toBeDefined();
      expect(closed.timeline).toContainEqual(
        expect.objectContaining({
          type: 'action',
          description: expect.stringContaining('closed'),
          actor: 'security-lead',
        })
      );
    });

    it('should require incident to be resolved before closing', () => {
      const incident = createIncident({
        severity: 'P1' as IncidentSeverity,
        type: 'unauthorized_access' as IncidentType,
        title: 'Active investigation',
        description: 'Still investigating',
        detectedBy: 'monitor',
      });

      expect(() => closeIncident(incident.id, 'user')).toThrow(
        'Incident must be resolved before closing'
      );
    });
  });

  describe('escalateIncident', () => {
    it('should escalate incident from P2 to P1', () => {
      const incident = createIncident({
        severity: 'P2' as IncidentSeverity,
        type: 'service_disruption' as IncidentType,
        title: 'Service degradation',
        description: 'Response times elevated',
        detectedBy: 'apm',
      });

      const escalated = escalateIncident(incident.id, 'P1' as IncidentSeverity, 'incident-commander', 'Impact worse than initially assessed');

      expect(escalated.severity).toBe('P1');
      expect(escalated.timeline).toContainEqual(
        expect.objectContaining({
          type: 'escalation',
          description: expect.stringContaining('Impact worse than initially assessed'),
          actor: 'incident-commander',
        })
      );
    });

    it('should not allow downgrading severity', () => {
      const incident = createIncident({
        severity: 'P1' as IncidentSeverity,
        type: 'data_breach' as IncidentType,
        title: 'Data breach',
        description: 'Confirmed breach',
        detectedBy: 'security',
      });

      expect(() =>
        escalateIncident(incident.id, 'P2' as IncidentSeverity, 'user', 'trying to downgrade')
      ).toThrow('Cannot downgrade severity');
    });

    it('should notify escalation contacts', () => {
      const incident = createIncident({
        severity: 'P1' as IncidentSeverity,
        type: 'ransomware' as IncidentType,
        title: 'Ransomware spreading',
        description: 'Multiple systems affected',
        detectedBy: 'edr',
      });

      const escalated = escalateIncident(
        incident.id,
        'P0' as IncidentSeverity,
        'security-lead',
        'Ransomware spreading rapidly'
      );

      expect(escalated.metadata.escalationNotificationsSent).toBeDefined();
      expect(escalated.metadata.escalationNotificationsSent).toContain('ceo');
      expect(escalated.metadata.escalationNotificationsSent).toContain('legal_counsel');
    });
  });
});
