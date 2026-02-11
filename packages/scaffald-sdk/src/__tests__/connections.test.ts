import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Scaffald } from '../client.js'
import { server } from './mocks/server'

describe('Connections', () => {
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

  // ===== Core Operations =====

  describe('list()', () => {
    it('should list all connections', async () => {
      const result = await client.connections.list()

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.total).toBe(10)
      expect(result.data).toHaveLength(10)
    })

    it('should include connection details', async () => {
      const result = await client.connections.list()

      const connection = result.data[0]
      expect(connection.id).toBe('conn_1')
      expect(connection.requester_id).toBe('user_1')
      expect(connection.addressee_id).toBe('user_2')
      expect(connection.status).toBe('accepted')
      expect(connection.created_at).toBeDefined()
      expect(connection.updated_at).toBeDefined()
    })

    it('should include user details for both parties', async () => {
      const result = await client.connections.list()

      const connection = result.data[0]
      expect(connection.requester).toBeDefined()
      expect(connection.requester?.id).toBe('user_1')
      expect(connection.requester?.first_name).toBe('Alice')
      expect(connection.requester?.last_name).toBe('Johnson')
      expect(connection.requester?.avatar_url).toBeDefined()

      expect(connection.addressee).toBeDefined()
      expect(connection.addressee?.id).toBe('user_2')
      expect(connection.addressee?.first_name).toBe('Bob')
    })

    it('should only return accepted connections', async () => {
      const result = await client.connections.list()

      result.data.forEach((conn) => {
        expect(conn.status).toBe('accepted')
      })
    })

    it('should return empty array when no connections', async () => {
      // Mock user with no connections
      const emptyClient = new Scaffald({
        apiKey: 'test_key_empty',
        baseUrl: 'https://api.scaffald.com',
      })

      const result = await emptyClient.connections.list()

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  // ===== Pending Requests =====

  describe('getPending()', () => {
    it('should get pending connection requests', async () => {
      const result = await client.connections.getPending()

      expect(result).toBeDefined()
      expect(result.sent).toBeInstanceOf(Array)
      expect(result.received).toBeInstanceOf(Array)
    })

    it('should separate sent and received requests', async () => {
      const result = await client.connections.getPending()

      expect(result.sent).toHaveLength(2)
      expect(result.received).toHaveLength(3)

      // All should be pending status
      result.sent.forEach((req) => {
        expect(req.status).toBe('pending')
        expect(req.requester_id).toBe('user_1') // Current user sent these
      })

      result.received.forEach((req) => {
        expect(req.status).toBe('pending')
        expect(req.addressee_id).toBe('user_1') // Current user received these
      })
    })

    it('should include requester details for received requests', async () => {
      const result = await client.connections.getPending()

      const received = result.received[0]
      expect(received.requester).toBeDefined()
      expect(received.requester.id).toBe('user_5')
      expect(received.requester.first_name).toBe('Eve')
      expect(received.requester.last_name).toBe('Williams')
      expect(received.requester.avatar_url).toBeDefined()
    })

    it('should return empty arrays when no pending requests', async () => {
      const emptyClient = new Scaffald({
        apiKey: 'test_key_empty',
        baseUrl: 'https://api.scaffald.com',
      })

      const result = await emptyClient.connections.getPending()

      expect(result.sent).toBeInstanceOf(Array)
      expect(result.sent).toHaveLength(0)
      expect(result.received).toBeInstanceOf(Array)
      expect(result.received).toHaveLength(0)
    })
  })

  // ===== Connection Status =====

  describe('getStatus()', () => {
    it('should get connection status - connected', async () => {
      const result = await client.connections.getStatus('user_2')

      expect(result).toBeDefined()
      expect(result.status).toBe('connected')
      expect(result.connectionId).toBe('conn_1')
    })

    it('should get connection status - pending sent', async () => {
      const result = await client.connections.getStatus('user_pending_sent')

      expect(result).toBeDefined()
      expect(result.status).toBe('pending_sent')
      expect(result.connectionId).toBe('conn_pending_1')
    })

    it('should get connection status - pending received', async () => {
      const result = await client.connections.getStatus('user_pending_received')

      expect(result).toBeDefined()
      expect(result.status).toBe('pending_received')
      expect(result.connectionId).toBe('conn_pending_2')
    })

    it('should get connection status - none', async () => {
      const result = await client.connections.getStatus('user_no_connection')

      expect(result).toBeDefined()
      expect(result.status).toBe('none')
      expect(result.connectionId).toBeUndefined()
    })

    it('should handle checking status for self', async () => {
      const result = await client.connections.getStatus('user_self')

      expect(result).toBeDefined()
      expect(result.status).toBe('none') // Cannot connect with yourself
    })

    it('should handle non-existent users', async () => {
      await expect(
        client.connections.getStatus('user_nonexistent')
      ).rejects.toThrow()
    })
  })

  // ===== Send Connection Request =====

  describe('send()', () => {
    it('should send connection request', async () => {
      const result = await client.connections.send({ targetUserId: 'user_new' })

      expect(result).toBeDefined()
      expect(result.id).toBe('conn_new_1')
      expect(result.requester_id).toBe('user_1')
      expect(result.addressee_id).toBe('user_new')
      expect(result.status).toBe('pending')
      expect(result.created_at).toBeDefined()
    })

    it('should include both user details', async () => {
      const result = await client.connections.send({ targetUserId: 'user_new' })

      expect(result.requester).toBeDefined()
      expect(result.requester?.id).toBe('user_1')
      expect(result.addressee).toBeDefined()
      expect(result.addressee?.id).toBe('user_new')
    })

    it('should reject duplicate connection requests', async () => {
      await expect(
        client.connections.send({ targetUserId: 'user_already_connected' })
      ).rejects.toThrow()
    })

    it('should reject sending request to yourself', async () => {
      await expect(
        client.connections.send({ targetUserId: 'user_self' })
      ).rejects.toThrow()
    })

    it('should reject when pending request exists', async () => {
      await expect(
        client.connections.send({ targetUserId: 'user_pending_sent' })
      ).rejects.toThrow()
    })

    it('should handle non-existent users', async () => {
      await expect(
        client.connections.send({ targetUserId: 'user_nonexistent' })
      ).rejects.toThrow()
    })
  })

  // ===== Accept Connection Request =====

  describe('accept()', () => {
    it('should accept connection request', async () => {
      const result = await client.connections.accept('conn_pending_3')

      expect(result).toBeDefined()
      expect(result.id).toBe('conn_pending_3')
      expect(result.status).toBe('accepted')
      expect(result.updated_at).toBeDefined()
      // updated_at should be recent
      const updatedTime = new Date(result.updated_at).getTime()
      expect(updatedTime).toBeGreaterThan(Date.now() - 5000)
    })

    it('should include both user details after acceptance', async () => {
      const result = await client.connections.accept('conn_pending_3')

      expect(result.requester).toBeDefined()
      expect(result.addressee).toBeDefined()
    })

    it('should reject accepting already accepted connection', async () => {
      await expect(
        client.connections.accept('conn_already_accepted')
      ).rejects.toThrow()
    })

    it('should reject accepting declined connection', async () => {
      await expect(
        client.connections.accept('conn_already_declined')
      ).rejects.toThrow()
    })

    it('should reject accepting request you sent', async () => {
      await expect(
        client.connections.accept('conn_you_sent')
      ).rejects.toThrow()
    })

    it('should handle non-existent connection', async () => {
      await expect(
        client.connections.accept('conn_nonexistent')
      ).rejects.toThrow()
    })
  })

  // ===== Decline Connection Request =====

  describe('decline()', () => {
    it('should decline connection request', async () => {
      await expect(
        client.connections.decline('conn_pending_4')
      ).resolves.not.toThrow()
    })

    it('should reject declining already accepted connection', async () => {
      await expect(
        client.connections.decline('conn_already_accepted')
      ).rejects.toThrow()
    })

    it('should reject declining request you sent', async () => {
      await expect(
        client.connections.decline('conn_you_sent')
      ).rejects.toThrow()
    })

    it('should handle non-existent connection', async () => {
      await expect(
        client.connections.decline('conn_nonexistent')
      ).rejects.toThrow()
    })

    it('should allow declining already declined (idempotent)', async () => {
      await expect(
        client.connections.decline('conn_already_declined')
      ).resolves.not.toThrow()
    })
  })

  // ===== Remove Connection =====

  describe('remove()', () => {
    it('should remove existing connection', async () => {
      await expect(
        client.connections.remove('conn_1')
      ).resolves.not.toThrow()
    })

    it('should handle removing non-existent connection', async () => {
      await expect(
        client.connections.remove('conn_nonexistent')
      ).rejects.toThrow()
    })

    it('should reject removing pending request', async () => {
      await expect(
        client.connections.remove('conn_pending_5')
      ).rejects.toThrow()
    })

    it('should allow removing already removed connection (idempotent)', async () => {
      await expect(
        client.connections.remove('conn_already_removed')
      ).resolves.not.toThrow()
    })
  })

  // ===== Cancel Connection Request =====

  describe('cancel()', () => {
    it('should cancel sent connection request', async () => {
      await expect(
        client.connections.cancel('conn_pending_sent_1')
      ).resolves.not.toThrow()
    })

    it('should reject canceling request you received', async () => {
      await expect(
        client.connections.cancel('conn_pending_received_1')
      ).rejects.toThrow()
    })

    it('should reject canceling accepted connection', async () => {
      await expect(
        client.connections.cancel('conn_already_accepted')
      ).rejects.toThrow()
    })

    it('should handle non-existent connection', async () => {
      await expect(
        client.connections.cancel('conn_nonexistent')
      ).rejects.toThrow()
    })

    it('should allow canceling already canceled (idempotent)', async () => {
      await expect(
        client.connections.cancel('conn_already_canceled')
      ).resolves.not.toThrow()
    })
  })

  // ===== Edge Cases & Validation =====

  describe('validation', () => {
    it('should reject empty targetUserId', async () => {
      await expect(
        client.connections.send({ targetUserId: '' })
      ).rejects.toThrow()
    })

    it('should reject invalid userId format', async () => {
      await expect(
        client.connections.send({ targetUserId: 'invalid@format' })
      ).rejects.toThrow()
    })

    it('should reject empty connectionId', async () => {
      await expect(
        client.connections.accept('')
      ).rejects.toThrow()
    })

    it('should reject invalid connectionId format', async () => {
      await expect(
        client.connections.accept('invalid-id-format')
      ).rejects.toThrow()
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle 401 unauthorized', async () => {
      await expect(
        client.connections.send({ targetUserId: 'user_unauthorized' })
      ).rejects.toThrow()
    })

    it('should handle 404 not found', async () => {
      await expect(
        client.connections.getStatus('user_nonexistent')
      ).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      await expect(
        client.connections.send({ targetUserId: 'user_rate_limit' })
      ).rejects.toThrow()
    })

    it('should handle 500 server error', { timeout: 15000 }, async () => {
      server.use(
        http.get('*/v1/connections', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(
        client.connections.list()
      ).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      await expect(
        client.connections.send({ targetUserId: 'user_network_error' })
      ).rejects.toThrow()
    })
  })

  // ===== Privacy & Social Graph =====

  describe('privacy and social graph', () => {
    it('should respect blocked users', async () => {
      await expect(
        client.connections.send({ targetUserId: 'user_blocked' })
      ).rejects.toThrow()
    })

    it('should not expose sensitive user data in connections', async () => {
      const result = await client.connections.list()

      result.data.forEach((conn) => {
        // Should not include email, phone, etc.
        expect(conn.requester).not.toHaveProperty('email')
        expect(conn.requester).not.toHaveProperty('phone')
        expect(conn.addressee).not.toHaveProperty('email')
        expect(conn.addressee).not.toHaveProperty('phone')
      })
    })

    it('should handle deactivated users', async () => {
      await expect(
        client.connections.send({ targetUserId: 'user_deactivated' })
      ).rejects.toThrow()
    })

    it('should handle private profiles', async () => {
      // Connection request should work for private profiles
      const result = await client.connections.send({ targetUserId: 'user_private' })

      expect(result).toBeDefined()
      expect(result.status).toBe('pending')
    })

    it('should respect connection limits', async () => {
      // Assuming there's a limit on connections
      await expect(
        client.connections.send({ targetUserId: 'user_exceeds_limit' })
      ).rejects.toThrow()
    })
  })

  // ===== Performance & Scalability =====

  describe('performance', () => {
    it('should handle users with many connections efficiently', async () => {
      const start = Date.now()
      const result = await client.connections.list()
      const duration = Date.now() - start

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(1000) // Should respond in < 1s
    })

    it('should handle many pending requests efficiently', async () => {
      const start = Date.now()
      const result = await client.connections.getPending()
      const duration = Date.now() - start

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(1000)
    })
  })

  // ===== Mutual Connections & Suggestions =====

  describe('social graph features', () => {
    it('should handle reciprocal connection flow', async () => {
      // User A sends request to User B
      const sent = await client.connections.send({ targetUserId: 'user_reciprocal' })
      expect(sent.status).toBe('pending')

      // User B accepts (simulated by accepting the connection)
      const accepted = await client.connections.accept(sent.id)
      expect(accepted.status).toBe('accepted')
    })

    it('should track connection timestamps accurately', async () => {
      const result = await client.connections.list()

      const connection = result.data[0]
      expect(connection.created_at).toBeDefined()
      expect(connection.updated_at).toBeDefined()

      const created = new Date(connection.created_at).getTime()
      const updated = new Date(connection.updated_at).getTime()

      expect(created).toBeLessThanOrEqual(updated)
    })
  })
})
