import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server.js'
import { http, HttpResponse } from 'msw'

describe('Certifications', () => {
  let client: Scaffald

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    client = new Scaffald({
      apiKey: 'test_key',
      baseUrl: 'https://api.scaffald.com',
    })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  // ===== Top-Level Certifications =====

  describe('getTopLevelCertifications()', () => {
    it('should get top-level certifications', async () => {
      const result = await client.certifications.getTopLevelCertifications()

      expect(result).toBeDefined()
      expect(result.certifications).toBeInstanceOf(Array)
    })

    it('should search certifications by query', async () => {
      const result = await client.certifications.getTopLevelCertifications({
        search: 'AWS',
        limit: 20,
      })

      expect(result).toBeDefined()
      expect(result.certifications).toBeInstanceOf(Array)
    })

    it('should respect limit parameter', async () => {
      const result = await client.certifications.getTopLevelCertifications({
        limit: 5,
      })

      expect(result.certifications.length).toBeLessThanOrEqual(5)
    })

    it('should include certification hierarchy info', async () => {
      const result = await client.certifications.getTopLevelCertifications()

      if (result.certifications.length > 0) {
        const cert = result.certifications[0]
        expect(cert.id).toBeDefined()
        expect(cert.title).toBeDefined()
        expect(cert.depth).toBeDefined()
        expect(cert.hierarchy_path).toBeDefined()
      }
    })
  })

  // ===== Certification Children =====

  describe('getCertificationChildren()', () => {
    it('should get children of a parent certification', async () => {
      const result = await client.certifications.getCertificationChildren({
        parent_id: 'parent_123',
      })

      expect(result).toBeDefined()
      expect(result.certifications).toBeInstanceOf(Array)
    })

    it('should handle parent with no children', async () => {
      server.use(
        http.get('*/v1/profiles/certifications/children', () => {
          return HttpResponse.json({ certifications: [] })
        })
      )

      const result = await client.certifications.getCertificationChildren({
        parent_id: 'leaf_cert',
      })

      expect(result.certifications).toHaveLength(0)
    })
  })

  // ===== User Certification Tree =====

  describe('getUserCertificationTree()', () => {
    it('should get user certification tree', async () => {
      const result = await client.certifications.getUserCertificationTree()

      expect(result).toBeDefined()
      expect(result.depth0).toBeInstanceOf(Array)
      expect(result.depth1ByParent).toBeDefined()
      expect(result.depth2ByParent).toBeDefined()
    })

    it('should organize certifications by depth', async () => {
      const result = await client.certifications.getUserCertificationTree()

      expect(result.depth0).toBeInstanceOf(Array)
      expect(typeof result.depth1ByParent).toBe('object')
      expect(typeof result.depth2ByParent).toBe('object')
    })
  })

  // ===== Add Certification =====

  describe('addCertification()', () => {
    it('should add a certification', async () => {
      const result = await client.certifications.addCertification({
        certification_id: 'cert_123',
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.certification).toBeDefined()
    })

    it('should include created certification details', async () => {
      const result = await client.certifications.addCertification({
        certification_id: 'cert_456',
      })

      expect(result.certification.id).toBeDefined()
      expect(result.certification.certification_id).toBe('cert_456')
    })
  })

  // ===== Add Category Certification =====

  describe('addCategoryCertification()', () => {
    it('should add a category certification', async () => {
      const result = await client.certifications.addCategoryCertification({
        category_id: 'category_123',
        parent_id: 'parent_456',
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.certification).toBeDefined()
    })

    it('should handle already existing category', async () => {
      server.use(
        http.post('*/v1/profiles/certifications/add-category', () => {
          return HttpResponse.json({
            success: true,
            certification: { id: 'existing', certification_id: 'category_123' },
            alreadyExists: true,
          })
        })
      )

      const result = await client.certifications.addCategoryCertification({
        category_id: 'category_123',
        parent_id: 'parent_456',
      })

      expect(result.alreadyExists).toBe(true)
    })
  })

  // ===== Toggle Specific Certification =====

  describe('toggleSpecificCertification()', () => {
    it('should toggle certification on', async () => {
      const result = await client.certifications.toggleSpecificCertification({
        certification_id: 'cert_789',
        parent_id: 'parent_123',
        checked: true,
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.certification).toBeDefined()
    })

    it('should toggle certification off', async () => {
      server.use(
        http.post('*/v1/profiles/certifications/toggle-specific', () => {
          return HttpResponse.json({
            success: true,
            certification: null,
          })
        })
      )

      const result = await client.certifications.toggleSpecificCertification({
        certification_id: 'cert_789',
        parent_id: 'parent_123',
        checked: false,
      })

      expect(result.success).toBe(true)
      expect(result.certification).toBeNull()
    })
  })

  // ===== Remove Top-Level Certification =====

  describe('removeTopLevelCertification()', () => {
    it('should remove top-level certification', async () => {
      const result = await client.certifications.removeTopLevelCertification({
        top_level_id: 'top_123',
        confirmed: true,
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should request confirmation when multiple affected', async () => {
      server.use(
        http.post('*/v1/profiles/certifications/remove-top-level', () => {
          return HttpResponse.json({
            success: false,
            needsConfirmation: true,
            affectedCount: 5,
            message: 'This will remove 5 certifications',
          })
        })
      )

      const result = await client.certifications.removeTopLevelCertification({
        top_level_id: 'top_456',
        confirmed: false,
      })

      expect(result.needsConfirmation).toBe(true)
      expect(result.affectedCount).toBe(5)
      expect(result.message).toBeDefined()
    })
  })

  // ===== Update Certification Proof =====

  describe('updateCertificationProof()', () => {
    it('should update certification with URL proof', async () => {
      const result = await client.certifications.updateCertificationProof({
        user_certification_id: 'user_cert_123',
        proof_type: 'url',
        credential_url: 'https://example.com/cert',
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.proofType).toBe('url')
      expect(result.url).toBeDefined()
    })

    it('should update certification with file proof', async () => {
      const result = await client.certifications.updateCertificationProof({
        user_certification_id: 'user_cert_456',
        proof_type: 'file',
        certificate_file: 'base64-encoded-file',
        file_name: 'cert.pdf',
        content_type: 'application/pdf',
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.proofType).toBe('file')
      expect(result.filePath).toBeDefined()
    })
  })

  // ===== Legacy Endpoints =====

  describe('getCertifications()', () => {
    it('should get legacy certifications', async () => {
      const result = await client.certifications.getCertifications()

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should handle empty certifications list', async () => {
      server.use(
        http.get('*/v1/profiles/certifications', () => {
          return HttpResponse.json([])
        })
      )

      const result = await client.certifications.getCertifications()
      expect(result).toHaveLength(0)
    })
  })

  describe('saveCertifications()', () => {
    it('should save legacy certifications', async () => {
      const result = await client.certifications.saveCertifications({
        certifications: [
          {
            id: 'cert_1',
            user_id: 'user_1',
            name: 'AWS Certified',
            issuing_organization: 'Amazon',
            issue_date: '2022-01-15',
            is_active: true,
            verification_status: 'unverified',
          },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.certifications).toBeInstanceOf(Array)
    })
  })

  describe('deleteCertification()', () => {
    it('should delete a legacy certification', async () => {
      const result = await client.certifications.deleteCertification({
        certificationId: 'cert_123',
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle nonexistent certification', async () => {
      server.use(
        http.post('*/v1/profiles/certifications/delete', () => {
          return HttpResponse.json(
            { error: 'Certification not found' },
            { status: 404 }
          )
        })
      )

      await expect(
        client.certifications.deleteCertification({ certificationId: 'invalid' })
      ).rejects.toThrow()
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/v1/profiles/certifications/top-level', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        })
      )

      await expect(
        client.certifications.getTopLevelCertifications()
      ).rejects.toThrow()
    })

    it('should handle rate limiting', async () => {
      server.use(
        http.get('*/v1/profiles/certifications/tree', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': '60' } }
          )
        })
      )

      await expect(client.certifications.getUserCertificationTree()).rejects.toThrow()
    })

    it('should handle server errors', async () => {
      server.use(
        http.post('*/v1/profiles/certifications/add', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(
        client.certifications.addCertification({ certification_id: 'cert_1' })
      ).rejects.toThrow()
    })
  })
})
