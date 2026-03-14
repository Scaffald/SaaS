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
})
