/**
 * DocumentBreadcrumb - Breadcrumb navigation using Beyond UI
 * Document Organization by Client/Project/GC
 */
import React from 'react';
import { Row, Text } from '@unicornlove/beyond-ui';
import { ChevronRight, Home } from 'lucide-react';

export interface DocumentBreadcrumbProps {
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  basePath?: string;
  showHome?: boolean;
  onNavigate?: (path: string) => void;
}

function Separator() {
  return (
    <ChevronRight size={16} color="currentColor" aria-hidden="true" />
  );
}

function BreadcrumbLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: (path: string) => void;
  children: React.ReactNode;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(href);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      style={{
        fontSize: '12px',
        color: 'var(--color-blue-9)',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  );
}

function CurrentPage({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: '12px',
        color: 'var(--color-gray-10)',
        fontWeight: 500,
      }}
      aria-current="page"
    >
      {children}
    </Text>
  );
}

export function DocumentBreadcrumb({
  clientId,
  clientName,
  projectId,
  projectName,
  basePath = '/dashboard',
  showHome = true,
  onNavigate,
}: DocumentBreadcrumbProps) {
  const breadcrumbs: React.ReactNode[] = [];

  // Home / Dashboard link
  if (showHome) {
    breadcrumbs.push(
      <BreadcrumbLink key="home" href={basePath} onClick={onNavigate}>
        <Row style={{ alignItems: 'center', gap: '4px' }}>
          <Home size={16} />
          <Text style={{ display: 'none' }}>Dashboard</Text>
        </Row>
      </BreadcrumbLink>
    );
  }

  // Documents root link
  if (clientId || projectId) {
    breadcrumbs.push(
      <BreadcrumbLink key="documents" href={`${basePath}/documents`} onClick={onNavigate}>
        Documents
      </BreadcrumbLink>
    );
  }

  // Client link
  if (clientId && clientName) {
    if (projectId && projectName) {
      breadcrumbs.push(
        <BreadcrumbLink key="client" href={`${basePath}/clients/${clientId}`} onClick={onNavigate}>
          {clientName}
        </BreadcrumbLink>
      );
    } else {
      breadcrumbs.push(
        <CurrentPage key="client">{clientName}</CurrentPage>
      );
    }
  }

  // Project (current page if present)
  if (projectId && projectName) {
    breadcrumbs.push(
      <CurrentPage key="project">{projectName}</CurrentPage>
    );
  }

  // If no client/project, Documents is the current page
  if (!clientId && !projectId) {
    breadcrumbs.push(
      <CurrentPage key="documents">Documents</CurrentPage>
    );
  }

  return (
    <nav aria-label="Breadcrumb">
      <Row style={{ alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Separator />}
            {crumb}
          </React.Fragment>
        ))}
      </Row>
    </nav>
  );
}

export default DocumentBreadcrumb;
