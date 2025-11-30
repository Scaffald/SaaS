// Main entry point for @scaffald/tamagui-ui
// Components will be exported here as they are added

// Export types
export type { Boundary, Coordinate } from './types/geographic'
export {
  formatPhoneNumber,
  getE164Format,
  getPhoneNumberType,
  getPhoneRegionCode,
  isValidPhoneNumber,
  phoneNumberSchema,
  requiredPhoneNumberSchema,
} from './types/phone'
