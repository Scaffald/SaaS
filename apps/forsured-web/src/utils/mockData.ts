import alertsData from '../data/alertsMock.json';
import integrationsData from '../data/integrationsMock.json';
import projectsData from '../data/projectsMock.json';
import subcontractorsData from '../data/subcontractorsMock.json';

export const mockAlerts = (alertsData as any).alerts.map((alert: unknown) => ({
  ...alert,
  dueDate: alert.dueDate ? new Date(alert.dueDate) : undefined,
}));

export const mockIntegrations = (integrationsData as any).integrations;
export const mockProjects = (projectsData as any).projects;
export const mockSubcontractors = (subcontractorsData as any).subcontractors;
