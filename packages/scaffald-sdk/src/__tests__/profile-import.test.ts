import { describe, expect, it } from 'vitest'
import { Scaffald } from '../client.js'

describe('ProfileImport Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('getImportData', () => {
    it('should get saved import data', async () => {
      const result = await client.profileImport.getImportData()

      expect(result).toBeDefined()
      // Result can be null if no import data exists
    })
  })

  describe('saveImportData', () => {
    it('should save import data for review', async () => {
      const result = await client.profileImport.saveImportData({
        source: 'resume',
        payload: {
          general: [],
          experience: [],
          education: [],
          skills: [],
          certifications: [],
        },
      })

      expect(result).toBeDefined()
      expect(result.metadata).toBeDefined()
    })
  })

  describe('clearImportData', () => {
    it('should clear saved import data', async () => {
      const result = await client.profileImport.clearImportData()

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })
  })

  // TODO: Implement these methods in ProfileImport resource
  describe.skip('importFromLinkedIn', () => {
    it('should import profile from LinkedIn', async () => {
      // const result = await client.profileImport.importFromLinkedIn({
      //   linkedin_url: 'https://linkedin.com/in/johndoe',
      //   merge_strategy: 'replace',
      // })
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('importFromResume', () => {
    it('should import profile from resume file', async () => {
      // const result = await client.profileImport.importFromResume({
      //   file_url: 'https://storage.example.com/resume.pdf',
      //   merge_strategy: 'merge',
      // })
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('previewImport', () => {
    it('should preview LinkedIn import', async () => {
      // const result = await client.profileImport.previewImport({
      //   source: 'linkedin',
      //   linkedin_url: 'https://linkedin.com/in/johndoe',
      //   merge_strategy: 'merge',
      // })
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('validateImport', () => {
    it('should validate import data', async () => {
      // const result = await client.profileImport.validateImport({
      //   source: 'linkedin',
      //   linkedin_url: 'https://linkedin.com/in/johndoe',
      // })
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('getImportStatus', () => {
    it('should get import status by ID', async () => {
      // const result = await client.profileImport.getImportStatus('import_123')
      // expect(result.data).toBeDefined()
    })
  })

  describe.skip('listImports', () => {
    it('should list import history', async () => {
      // const result = await client.profileImport.listImports()
      // expect(result.data).toBeDefined()
    })
  })
})
