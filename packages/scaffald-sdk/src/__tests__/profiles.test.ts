import { describe, it, expect } from 'vitest'
import { Scaffald } from '../client'

describe('Profiles Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('getUser', () => {
    it('should get a user profile by username', async () => {
      const profile = await client.profiles.getUser('johndoe')

      expect(profile).toHaveProperty('id')
      expect(profile).toHaveProperty('username')
      expect(profile.username).toBe('johndoe')
      expect(profile).toHaveProperty('created_at')
    })

    it('should return profile with skills', async () => {
      const profile = await client.profiles.getUser('janedoe')

      expect(profile.skills).toBeDefined()
      expect(Array.isArray(profile.skills)).toBe(true)
    })

    it('should return profile with certifications', async () => {
      const profile = await client.profiles.getUser('johndoe')

      if (profile.certifications) {
        expect(Array.isArray(profile.certifications)).toBe(true)
        expect(profile.certifications[0]).toHaveProperty('name')
      }
    })
  })

  describe('getOrganization', () => {
    it('should get an organization profile by slug', async () => {
      const org = await client.profiles.getOrganization('acme-corp')

      expect(org).toHaveProperty('id')
      expect(org).toHaveProperty('slug')
      expect(org.slug).toBe('acme-corp')
      expect(org).toHaveProperty('name')
      expect(org).toHaveProperty('job_count')
    })

    it('should return organization with logo', async () => {
      const org = await client.profiles.getOrganization('tech-company')

      expect(org.logo_url).toBeDefined()
    })
  })

  describe('getEmployer', () => {
    it('should get an employer profile by slug', async () => {
      const employer = await client.profiles.getEmployer('startup-inc')

      expect(employer).toHaveProperty('id')
      expect(employer).toHaveProperty('slug')
      expect(employer.slug).toBe('startup-inc')
      expect(employer).toHaveProperty('name')
      expect(employer).toHaveProperty('active_jobs_count')
    })

    it('should return employer with industry', async () => {
      const employer = await client.profiles.getEmployer('consulting-firm')

      expect(employer.industry).toBeDefined()
    })
  })
})
