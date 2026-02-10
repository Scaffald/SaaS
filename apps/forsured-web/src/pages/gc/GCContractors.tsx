// src/pages/gc/GCContractors.tsx
import { Users } from 'lucide-react'
import { Stack, H1 } from '@unicornlove/beyond-ui'
import { EmptyState } from '../../ui/EmptyState'
import { useLexicon } from '../../contexts/LexiconContext'

function GCContractors() {
  // Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon()

  const handleInviteContractor = () => {
    console.log('Navigate to invite contractor flow')
  }

  // Simulate no contractors available
  const hasContractors = false

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <H1>{getContractorLabel(true)}</H1>
      {!hasContractors ? (
        <EmptyState
          icon={<Users size={48} />}
          title={`No ${getContractorLabel(true)} Yet`}
          description={`Invite ${getContractorLabel(true).toLowerCase()} to your projects to track their compliance.`}
          primaryAction={{
            label: `Invite ${getContractorLabel()}`,
            onClick: handleInviteContractor,
          }}
          helpLinks={[{ label: 'How to Invite', href: '#' }]}
        />
      ) : (
        // Render contractors list here
        <Stack>{getContractorLabel(true)} List</Stack>
      )}
    </Stack>
  )
}

export default GCContractors
