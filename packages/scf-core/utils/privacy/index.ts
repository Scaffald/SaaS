export type { TrackingAuthorizationStatus } from './types'
export { canLinkIdentity } from './types'
export {
  getTrackingAuthorizationStatus,
  refreshTrackingAuthorizationStatus,
  requestTrackingAuthorization,
} from './tracking-authorization'
export {
  useTrackingAuthorization,
  type UseTrackingAuthorizationResult,
} from './useTrackingAuthorization'
