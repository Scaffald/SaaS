/**
 * DocumentBreadcrumb tests
 * REQ-284: Document Organization by Client/Project/GC
 * TASK-3: Implement Breadcrumb Navigation for Document Hierarchy
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { DocumentBreadcrumb } from '../DocumentBreadcrumb';

describe('DocumentBreadcrumb', () => {
  describe('rendering', () => {
    it('renders breadcrumb navigation', () => {
      render(<DocumentBreadcrumb />);

      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    });

    it('renders home/dashboard link when showHome is true', () => {
      render(<DocumentBreadcrumb showHome={true} />);

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('hides home link when showHome is false', () => {
      render(<DocumentBreadcrumb showHome={false} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });

    it('renders Documents as current page when no client/project', () => {
      render(<DocumentBreadcrumb />);

      const currentPage = screen.getByText('Documents');
      expect(currentPage).toBeInTheDocument();
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('with client context', () => {
    it('renders client name as current page when no project', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Construction"
        />
      );

      const clientText = screen.getByText('ABC Construction');
      expect(clientText).toBeInTheDocument();
      expect(clientText).toHaveAttribute('aria-current', 'page');
    });

    it('renders Documents link when client is selected', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Construction"
        />
      );

      expect(screen.getByRole('link', { name: 'Documents' })).toBeInTheDocument();
    });
  });

  describe('with client and project context', () => {
    it('renders breadcrumb with client and project', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          projectId="proj-1"
          projectName="Building A"
        />
      );

      // Client should be a link
      const clientLink = screen.getByRole('link', { name: 'ABC Corp' });
      expect(clientLink).toBeInTheDocument();

      // Project should be current page
      const projectText = screen.getByText('Building A');
      expect(projectText).toHaveAttribute('aria-current', 'page');
    });

    it('client link has correct href', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-123"
          clientName="ABC Corp"
          projectId="proj-1"
          projectName="Building A"
          basePath="/dashboard"
        />
      );

      const clientLink = screen.getByRole('link', { name: 'ABC Corp' });
      expect(clientLink).toHaveAttribute('href', '/dashboard/clients/client-123');
    });

    it('documents link has correct href', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          projectId="proj-1"
          projectName="Building A"
          basePath="/dashboard"
        />
      );

      const docsLink = screen.getByRole('link', { name: 'Documents' });
      expect(docsLink).toHaveAttribute('href', '/dashboard/documents');
    });
  });

  describe('current page indicator', () => {
    it('documents is not a link when current', () => {
      render(<DocumentBreadcrumb />);

      // Documents should be text, not a link
      const documentsText = screen.getByText('Documents');
      expect(documentsText.tagName.toLowerCase()).toBe('span');
      expect(screen.queryByRole('link', { name: 'Documents' })).not.toBeInTheDocument();
    });

    it('project is not a link when current', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          projectId="proj-1"
          projectName="Building A"
        />
      );

      const projectText = screen.getByText('Building A');
      expect(projectText.tagName.toLowerCase()).toBe('span');
    });

    it('current page has aria-current attribute', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          projectId="proj-1"
          projectName="Building A"
        />
      );

      const currentPage = screen.getByText('Building A');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('separators', () => {
    it('renders separators between breadcrumb items', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          projectId="proj-1"
          projectName="Building A"
        />
      );

      // Check for chevron icons (separators) - there should be multiple
      const nav = screen.getByRole('navigation');
      const separators = nav.querySelectorAll('svg.lucide-chevron-right');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('custom base path', () => {
    it('uses custom basePath for navigation', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          basePath="/app"
        />
      );

      const docsLink = screen.getByRole('link', { name: 'Documents' });
      expect(docsLink).toHaveAttribute('href', '/app/documents');
    });

    it('home link uses basePath', () => {
      render(<DocumentBreadcrumb basePath="/custom" showHome={true} />);

      const homeLink = screen.getByRole('link', { name: /dashboard/i });
      expect(homeLink).toHaveAttribute('href', '/custom');
    });
  });

  describe('onNavigate callback', () => {
    it('calls onNavigate when client link is clicked', async () => {
      const onNavigate = vi.fn();
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          projectId="proj-1"
          projectName="Building A"
          basePath="/dashboard"
          onNavigate={onNavigate}
        />
      );

      const clientLink = screen.getByRole('link', { name: 'ABC Corp' });
      await userEvent.click(clientLink);

      expect(onNavigate).toHaveBeenCalledWith('/dashboard/clients/client-1');
    });

    it('calls onNavigate when documents link is clicked', async () => {
      const onNavigate = vi.fn();
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          basePath="/dashboard"
          onNavigate={onNavigate}
        />
      );

      const docsLink = screen.getByRole('link', { name: 'Documents' });
      await userEvent.click(docsLink);

      expect(onNavigate).toHaveBeenCalledWith('/dashboard/documents');
    });

    it('calls onNavigate when home link is clicked', async () => {
      const onNavigate = vi.fn();
      render(
        <DocumentBreadcrumb
          basePath="/dashboard"
          onNavigate={onNavigate}
        />
      );

      const homeLink = screen.getByRole('link', { name: /dashboard/i });
      await userEvent.click(homeLink);

      expect(onNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('accessibility', () => {
    it('has navigation landmark with breadcrumb label', () => {
      render(<DocumentBreadcrumb />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    });

    it('separators are hidden from screen readers', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          projectId="proj-1"
          projectName="Building A"
        />
      );

      const nav = screen.getByRole('navigation');
      const separators = nav.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles missing client name with client ID', () => {
      render(<DocumentBreadcrumb clientId="client-1" />);

      // Should not crash, navigation should render
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      // Documents link should be present (since clientId is provided)
      // but no client name means we don't add client breadcrumb
      expect(screen.getByRole('link', { name: 'Documents' })).toBeInTheDocument();
    });

    it('handles missing project name with project ID', () => {
      render(
        <DocumentBreadcrumb
          clientId="client-1"
          clientName="ABC Corp"
          projectId="proj-1"
        />
      );

      // Should show client as current since no project name
      const clientText = screen.getByText('ABC Corp');
      expect(clientText).toHaveAttribute('aria-current', 'page');
    });
  });
});
