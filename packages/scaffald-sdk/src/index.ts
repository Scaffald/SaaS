export { Scaffald } from './client.js'
export type { ScaffaldConfig } from './config.js'
export type { RateLimitInfo } from './http/client.js'
export {
  ScaffaldError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  APIError,
} from './http/errors.js'

export type {
  Job,
  JobListParams,
  JobListResponse,
  CreateJobParams,
} from './resources/jobs.js'

import { Scaffald } from './client.js'
export default Scaffald
