/**
 * DocumentBreadcrumb - Breadcrumb navigation using Tamagui
 * REQ-284: Document Organization by Client/Project/GC
 */
import React from 'react';
import { XStack, Text, styled } from '@unicornlove/ui';
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

// Styled anchor for breadcrumb navigation with proper link semantics
const StyledAnchor = styled(Text, {
  name: 'BreadcrumbAnchor',
  tag: 'a',
  fontSize: '$2',
  color: '$blue9',
  cursor: 'pointer',
  textDecorationLine: 'none',
  
  hoverStyle: {
    color: '$blue11',
    textDecorationLine: 'underline',
  },
});

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
    <StyledAnchor
      href={href}
      onClick={handleClick}
    >
      {children}
    </StyledAnchor>
  );
}

function CurrentPage({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="$2" color="$color10" fontWeight="500" aria-current="page">
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
        <XStack alignItems="center" gap="$1">
          <Home size={16} />
          <Text display={{ sm: 'none' }}>Dashboard</Text>
        </XStack>
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
      <XStack alignItems="center" gap="$2" flexWrap="wrap">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Separator />}
            {crumb}
          </React.Fragment>
        ))}
      </XStack>
    </nav>
  );
}

export default DocumentBreadcrumb;
