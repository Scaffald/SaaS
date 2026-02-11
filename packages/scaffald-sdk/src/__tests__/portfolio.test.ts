import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server.js'
import { http, HttpResponse } from 'msw'

describe('Portfolio', () => {
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

  // ===== List Portfolio Items =====

  describe('list()', () => {
    it('should list portfolio items', async () => {
      const result = await client.portfolio.list()

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should list portfolio items for specific user', async () => {
      const result = await client.portfolio.list({ userId: 'user_123' })

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should include full portfolio item details', async () => {
      const result = await client.portfolio.list()

      if (result.length > 0) {
        const item = result[0]
        expect(item.id).toBeDefined()
        expect(item.user_id).toBeDefined()
        expect(item.title).toBeDefined()
        expect(item.display_order).toBeDefined()
        expect(item.created_at).toBeDefined()
        expect(item.updated_at).toBeDefined()
      }
    })

    it('should handle empty portfolio', async () => {
      server.use(
        http.get('*/v1/profiles/portfolio', () => {
          return HttpResponse.json([])
        })
      )

      const result = await client.portfolio.list()
      expect(result).toHaveLength(0)
    })
  })

  // ===== Create Portfolio Item =====

  describe('create()', () => {
    it('should create a portfolio item', async () => {
      const result = await client.portfolio.create({
        title: 'My Project',
        description: { content: 'A great project' },
        imageUrl: 'https://example.com/image.jpg',
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.title).toBe('My Project')
    })

    it('should create portfolio item with minimal data', async () => {
      const result = await client.portfolio.create({
        title: 'Simple Project',
      })

      expect(result).toBeDefined()
      expect(result.title).toBe('Simple Project')
    })

    it('should create portfolio item with file path', async () => {
      const result = await client.portfolio.create({
        title: 'Project with File',
        description: { content: 'Has a file attached' },
        filePath: '/uploads/portfolio/file.pdf',
      })

      expect(result).toBeDefined()
      expect(result.file_path).toBeDefined()
    })

    it('should create portfolio item with display order', async () => {
      const result = await client.portfolio.create({
        title: 'Ordered Project',
        displayOrder: 5,
      })

      expect(result).toBeDefined()
      expect(result.display_order).toBe(5)
    })

    it('should validate required fields', async () => {
      server.use(
        http.post('*/v1/profiles/portfolio', () => {
          return HttpResponse.json(
            { error: 'title is required' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.portfolio.create({ title: '' })
      ).rejects.toThrow()
    })
  })

  // ===== Update Portfolio Item =====

  describe('update()', () => {
    it('should update a portfolio item', async () => {
      const result = await client.portfolio.update({
        id: 'portfolio_123',
        title: 'Updated Title',
        description: { content: 'Updated description' },
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('portfolio_123')
    })

    it('should update portfolio item display order', async () => {
      const result = await client.portfolio.update({
        id: 'portfolio_456',
        displayOrder: 3,
      })

      expect(result).toBeDefined()
      expect(result.display_order).toBe(3)
    })

    it('should clear image URL with null', async () => {
      const result = await client.portfolio.update({
        id: 'portfolio_789',
        imageUrl: null,
      })

      expect(result).toBeDefined()
    })

    it('should clear file path with null', async () => {
      const result = await client.portfolio.update({
        id: 'portfolio_101',
        filePath: null,
      })

      expect(result).toBeDefined()
    })

    it('should handle nonexistent portfolio item', async () => {
      server.use(
        http.patch('*/v1/profiles/portfolio/:id', () => {
          return HttpResponse.json(
            { error: 'Portfolio item not found' },
            { status: 404 }
          )
        })
      )

      await expect(
        client.portfolio.update({ id: 'invalid', title: 'Test' })
      ).rejects.toThrow()
    })
  })

  // ===== Delete Portfolio Item =====

  describe('delete()', () => {
    it('should delete a portfolio item', async () => {
      const result = await client.portfolio.delete({ id: 'portfolio_123' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.deletedItem).toBeDefined()
    })

    it('should return deleted item details', async () => {
      const result = await client.portfolio.delete({ id: 'portfolio_456' })

      expect(result.deletedItem.id).toBe('portfolio_456')
    })

    it('should handle nonexistent portfolio item', async () => {
      server.use(
        http.delete('*/v1/profiles/portfolio/:id', () => {
          return HttpResponse.json(
            { error: 'Portfolio item not found' },
            { status: 404 }
          )
        })
      )

      await expect(
        client.portfolio.delete({ id: 'invalid' })
      ).rejects.toThrow()
    })
  })

  // ===== Reorder Portfolio Items =====

  describe('reorder()', () => {
    it('should reorder portfolio items', async () => {
      const result = await client.portfolio.reorder({
        items: [
          { id: 'item_1', displayOrder: 0 },
          { id: 'item_2', displayOrder: 1 },
          { id: 'item_3', displayOrder: 2 },
        ],
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(3)
    })

    it('should handle empty reorder array', async () => {
      server.use(
        http.post('*/v1/profiles/portfolio/reorder', () => {
          return HttpResponse.json({
            success: true,
            updatedCount: 0,
          })
        })
      )

      const result = await client.portfolio.reorder({ items: [] })

      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(0)
    })
  })

  // ===== Upload Portfolio Image =====

  describe('uploadImage()', () => {
    it('should upload a portfolio image', async () => {
      const result = await client.portfolio.uploadImage({
        file: 'base64-encoded-image-data',
        fileName: 'project-image.jpg',
        contentType: 'image/jpeg',
      })

      expect(result).toBeDefined()
      expect(result.filePath).toBeDefined()
      expect(result.imageUrl).toBeDefined()
    })

    it('should upload image for specific portfolio item', async () => {
      const result = await client.portfolio.uploadImage({
        portfolioItemId: 'portfolio_123',
        file: 'base64-encoded-image-data',
        fileName: 'updated-image.png',
        contentType: 'image/png',
      })

      expect(result).toBeDefined()
      expect(result.filePath).toBeDefined()
      expect(result.imageUrl).toBeDefined()
    })

    it('should validate file type', async () => {
      server.use(
        http.post('*/v1/profiles/portfolio/upload-image', () => {
          return HttpResponse.json(
            { error: 'Invalid file type. Only images allowed.' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.portfolio.uploadImage({
          file: 'base64-data',
          fileName: 'document.pdf',
          contentType: 'application/pdf',
        })
      ).rejects.toThrow()
    })

    it('should validate file size', async () => {
      server.use(
        http.post('*/v1/profiles/portfolio/upload-image', () => {
          return HttpResponse.json(
            { error: 'File size exceeds maximum allowed' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.portfolio.uploadImage({
          file: 'very-large-base64-data',
          fileName: 'huge-image.jpg',
          contentType: 'image/jpeg',
        })
      ).rejects.toThrow()
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/v1/profiles/portfolio', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        })
      )

      await expect(client.portfolio.list()).rejects.toThrow()
    })

    it('should handle rate limiting', async () => {
      server.use(
        http.get('*/v1/profiles/portfolio', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': '60' } }
          )
        })
      )

      await expect(client.portfolio.list()).rejects.toThrow()
    })

    it('should handle server errors', async () => {
      server.use(
        http.post('*/v1/profiles/portfolio', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(
        client.portfolio.create({ title: 'Test Project' })
      ).rejects.toThrow()
    })
  })
})
