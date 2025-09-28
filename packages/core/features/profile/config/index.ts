/**
 * Profile Configuration Exports
 * Centralized exports for all profile form schemas
 */

// General Profile
export * from './general-schema'

// Employment Profile
export * from './employment-schema'

// Skills Profile
export * from './skills-schema'

// Certifications Profile
export * from './certifications-schema'

// Education Profile
export * from './education-schema'

// Experience Profile
export * from './experience-schema'

// Combined type for all profile sections
export type ProfileSections = {
  general: import('./general-schema').GeneralProfileFormData
  employment: import('./employment-schema').EmploymentProfileFormData
  skills: import('./skills-schema').SkillsProfileFormData
  certifications: import('./certifications-schema').CertificationsProfileFormData
  education: import('./education-schema').EducationProfileFormData
  experience: import('./experience-schema').ExperienceProfileFormData
}
