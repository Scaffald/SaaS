/**
 * Modal component exports
 */

export { Modal } from './Modal'
export { ResponsiveModal } from './ResponsiveModal'
export { ModalHeader } from './ModalHeader'
export { ModalActions } from './ModalActions'
export { ModalContent } from './ModalContent'

// Variants
export { ConfirmationModal } from './variants/ConfirmationModal'
export { EcommerceShippingModal } from './variants/EcommerceShippingModal'
export { EcommerceCartPreviewModal } from './variants/EcommerceCartPreviewModal'
export { WorkspaceMembersModal } from './variants/WorkspaceMembersModal'

export type {
  ModalProps,
} from './Modal.types'

export type {
  ModalHeaderProps,
  ModalHeaderOrientation,
} from './ModalHeader.types'

export type {
  ModalActionsProps,
  ModalAction,
  ModalActionsOrientation,
} from './ModalActions.types'

export type {
  ModalContentProps,
  ModalContentVariant,
} from './ModalContent.types'

export type { ModalStyleConfig } from './Modal.styles'
export type { ModalHeaderStyleConfig } from './ModalHeader.styles'
export type { ModalActionsStyleConfig } from './ModalActions.styles'
export type { ModalContentStyleConfig } from './ModalContent.styles'

// Variant types
export type { ConfirmationModalProps } from './variants/ConfirmationModal.types'
export type {
  EcommerceShippingModalProps,
  ShippingOption,
} from './variants/EcommerceShippingModal.types'
export type {
  EcommerceCartPreviewModalProps,
  CartItem,
} from './variants/EcommerceCartPreviewModal.types'
export type {
  WorkspaceMembersModalProps,
  Member,
} from './variants/WorkspaceMembersModal.types'
