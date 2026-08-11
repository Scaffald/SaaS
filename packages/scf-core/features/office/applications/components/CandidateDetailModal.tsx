import { ROUTES } from '@scf/core/constants/routes'
import type { MockApplication } from '../../mock-data/ats-mock-data'
import { Button, ResponsiveModal, Row } from '@scaffald/ui'
import { ExternalLink } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { CandidateDetailContent } from './CandidateDetailContent'

interface CandidateDetailModalProps {
  application: MockApplication | null
  open: boolean
  onClose: () => void
}

/**
 * The kanban board's candidate detail.
 *
 * A thin container now: the body lives in CandidateDetailContent, which the
 * per-application route renders too (#537). Keeping both meant the modal stays
 * where it is useful — a quick look without leaving the board — while the route
 * gives the same detail a URL.
 */
export const CandidateDetailModal = ({ application, open, onClose }: CandidateDetailModalProps) => {
  const router = useRouter()

  if (!application) return null

  const detailPath = ROUTES.OFFICE.APPLICATIONS.DETAIL.path.replace(
    ':applicationId',
    application.id
  )

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      title={application.candidate.name}
      size="lg"
    >
      {/* The way out of the modal and into a URL. Without this the detail is
          reachable only by opening the board and clicking a card, which is
          what made it unshareable (#537). */}
      <Row justify="flex-end">
        <Button
          size="sm"
          variant="outline"
          iconStart={ExternalLink}
          onPress={() => {
            onClose()
            router.push(detailPath)
          }}
        >
          Open full page
        </Button>
      </Row>

      <CandidateDetailContent application={application} />
    </ResponsiveModal>
  )
}
