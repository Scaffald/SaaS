/**
 * GCDashboard - GC dashboard page using Beyond UI
 */
import React from 'react'
import { Stack, Row, Text, Card, Button, Chip } from '@unicornlove/beyond-ui'
import { EmptyState } from '../../ui/EmptyState'
import { Archive, Building2, Users, CheckCircle, Plus } from 'lucide-react'
import { useLexicon } from '../../contexts/LexiconContext'
import PageTransition from '../../components/Common/PageTransition'
import AnimatedList from '../../components/Common/AnimatedList'

// Mock projects for testing
const mockProjects = [
  {
    id: 'project-1',
    name: 'Downtown Tower',
    address: '123 Main St, Austin, TX',
    status: 'active',
    contractorCount: 5,
    complianceScore: 85,
  },
  {
    id: 'project-2',
    name: 'Harbor View Complex',
    address: '456 Harbor Dr, Austin, TX',
    status: 'active',
    contractorCount: 3,
    complianceScore: 92,
  },
]

function GCDashboard() {
  // Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon()

  const handleCreateProject = () => {
    console.log('Navigate to create project page')
  }

  const hasProjects = mockProjects.length > 0

  return (
    <PageTransition>
      <Stack style={{ gap: 'var(--space-6)' }}>
        <Text
          style={{
            fontSize: 'var(--font-size-8)',
            fontWeight: 700,
            marginBottom: 'var(--space-6)',
          }}
        >
          {t('nav.dashboard')}
        </Text>
        {!hasProjects ? (
          <EmptyState
            icon={<Archive size={48} />}
            title="No Projects Yet"
            description={`Create your first project to start managing ${getContractorLabel().toLowerCase()} compliance.`}
            primaryAction={{ label: 'Create Project', onClick: handleCreateProject }}
            helpLinks={[
              { label: 'Watch Tutorial', href: '#' },
              { label: 'Read Guide', href: '#' },
            ]}
          />
        ) : (
          <Stack style={{ gap: 'var(--space-6)' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 'var(--font-size-5)', fontWeight: 600 }}>
                Active Projects
              </Text>
              <Button
                data-testid="new-project-button"
                color="primary"
                iconStart={Plus}
                onPress={handleCreateProject}
              >
                New Project
              </Button>
            </Row>
            <AnimatedList
              items={mockProjects}
              keyExtractor={(project) => project.id}
              gap={16}
              style={{ display: 'flex', flexWrap: 'wrap' }}
            >
              {(project) => (
                <Card
                  data-testid="project-card"
                  style={{
                    padding: 'var(--space-6)',
                    cursor: 'pointer',
                    flex: 1,
                    minWidth: 300,
                  }}
                >
                  <Row
                    style={{
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Stack
                        style={{
                          padding: 'var(--space-2)',
                          backgroundColor: 'var(--color-blue-3)',
                          borderRadius: 'var(--radius-3)',
                        }}
                      >
                        <Building2 size={24} color="currentColor" />
                      </Stack>
                      <Stack>
                        <Text style={{ fontSize: 'var(--font-size-5)', fontWeight: 600 }}>
                          {project.name}
                        </Text>
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>
                          {project.address}
                        </Text>
                      </Stack>
                    </Row>
                    <Chip type="success" size="sm">
                      {project.status}
                    </Chip>
                  </Row>
                  <Row
                    style={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 'var(--font-size-2)',
                    }}
                  >
                    <Row
                      style={{
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        color: 'var(--color-10)',
                      }}
                    >
                      <Users size={16} />
                      <Text>{project.contractorCount} contractors</Text>
                    </Row>
                    <Row style={{ alignItems: 'center', gap: 'var(--space-1)' }}>
                      <CheckCircle size={16} color="currentColor" />
                      <Text style={{ fontWeight: 500 }} data-testid="compliance-score">
                        {project.complianceScore}% compliant
                      </Text>
                    </Row>
                  </Row>
                </Card>
              )}
            </AnimatedList>
          </Stack>
        )}
      </Stack>
    </PageTransition>
  )
}

export default GCDashboard
