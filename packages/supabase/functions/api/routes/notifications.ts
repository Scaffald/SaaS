/**
 * Notifications REST API
 * Manages user notifications and preferences
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi('ErrorResponse')

const notificationTypeSchema = z.enum([
  'application_status',
  'connection_request',
  'message',
  'job_match',
  'system',
])

const notificationSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    type: notificationTypeSchema,
    title: z.string(),
    message: z.string(),
    read: z.boolean(),
    read_at: z.string().nullable(),
    metadata: z.record(z.unknown()).nullable(),
    action_url: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string().optional(),
  })
  .openapi('Notification')

const paginationSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  total_pages: z.number().int(),
})

// Request schemas
const listNotificationsQuerySchema = z.object({
  read: z
    .string()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined))
    .optional(),
  type: notificationTypeSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
})

const quietHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  end: z.string().regex(/^\d{2}:\d{2}$/),
})

const notificationTypeSettingsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
})

const updatePreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  notification_types: z.record(notificationTypeSettingsSchema.partial()).optional(),
  quiet_hours: quietHoursSchema.optional(),
})

const notificationPreferencesSchema = z
  .object({
    user_id: z.string().uuid(),
    email_notifications: z.boolean(),
    push_notifications: z.boolean(),
    notification_types: z.record(notificationTypeSettingsSchema),
    quiet_hours: quietHoursSchema.optional(),
  })
  .openapi('NotificationPreferences')

// Response schemas
const notificationsListResponseSchema = z
  .object({
    data: z.array(notificationSchema),
    pagination: paginationSchema,
  })
  .openapi('NotificationsListResponse')

const notificationResponseSchema = z
  .object({
    data: notificationSchema,
  })
  .openapi('NotificationResponse')

const unreadCountResponseSchema = z
  .object({
    data: z.object({
      unread_count: z.number().int(),
    }),
  })
  .openapi('UnreadCountResponse')

const markAllAsReadResponseSchema = z
  .object({
    data: z.object({
      updated_count: z.number().int(),
    }),
  })
  .openapi('MarkAllAsReadResponse')

const deleteAllResponseSchema = z
  .object({
    data: z.object({
      deleted_count: z.number().int(),
    }),
  })
  .openapi('DeleteAllResponse')

const preferencesResponseSchema = z
  .object({
    data: notificationPreferencesSchema,
  })
  .openapi('PreferencesResponse')

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/notifications
 * List notifications with filtering and pagination
 */
const listNotificationsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Notifications'],
  summary: 'List notifications',
  description: 'Get notifications for the authenticated user with filtering and pagination',
  request: {
    query: listNotificationsQuerySchema,
  },
  responses: {
    200: {
      description: 'List of notifications',
      content: {
        'application/json': {
          schema: notificationsListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(listNotificationsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { read, type, page, limit } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const offset = (page - 1) * limit

  let query = supabase
    .schema('core')
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (read !== undefined) {
    query = query.eq('read', read)
  }

  if (type) {
    query = query.eq('type', type)
  }

  const { data: notifications, count, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching notifications:', error)
    return c.json({ error: 'Failed to fetch notifications', message: error.message }, 500)
  }

  const totalPages = Math.ceil((count || 0) / limit)

  return c.json({
    data: notifications || [],
    pagination: {
      total: count || 0,
      page,
      limit,
      total_pages: totalPages,
    },
  })
})

/**
 * GET /v1/notifications/:id
 * Get a specific notification
 */
const getNotificationRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Notifications'],
  summary: 'Get notification',
  description: 'Get a specific notification by ID',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Notification details',
      content: {
        'application/json': {
          schema: notificationResponseSchema,
        },
      },
    },
    404: {
      description: 'Notification not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getNotificationRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: notification, error } = await supabase
    .schema('core')
    .from('notifications')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return c.json({ error: 'Notification not found' }, 404)
    }
    console.error('Error fetching notification:', error)
    return c.json({ error: 'Failed to fetch notification', message: error.message }, 500)
  }

  return c.json({ data: notification })
})

/**
 * PATCH /v1/notifications/:id/read
 * Mark a notification as read
 */
const markAsReadRoute = createRoute({
  method: 'patch',
  path: '/{id}/read',
  tags: ['Notifications'],
  summary: 'Mark as read',
  description: 'Mark a notification as read',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Notification marked as read',
      content: {
        'application/json': {
          schema: notificationResponseSchema,
        },
      },
    },
    404: {
      description: 'Notification not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(markAsReadRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: notification, error } = await supabase
    .schema('core')
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error marking notification as read:', error)
    return c.json({ error: 'Failed to update notification', message: error.message }, 500)
  }

  return c.json({ data: notification })
})

/**
 * PATCH /v1/notifications/:id/unread
 * Mark a notification as unread
 */
const markAsUnreadRoute = createRoute({
  method: 'patch',
  path: '/{id}/unread',
  tags: ['Notifications'],
  summary: 'Mark as unread',
  description: 'Mark a notification as unread',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Notification marked as unread',
      content: {
        'application/json': {
          schema: notificationResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(markAsUnreadRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: notification, error } = await supabase
    .schema('core')
    .from('notifications')
    .update({
      read: false,
      read_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error marking notification as unread:', error)
    return c.json({ error: 'Failed to update notification', message: error.message }, 500)
  }

  return c.json({ data: notification })
})

/**
 * POST /v1/notifications/read-all
 * Mark all notifications as read
 */
const markAllAsReadRoute = createRoute({
  method: 'post',
  path: '/read-all',
  tags: ['Notifications'],
  summary: 'Mark all as read',
  description: 'Mark all unread notifications as read',
  responses: {
    200: {
      description: 'All notifications marked as read',
      content: {
        'application/json': {
          schema: markAllAsReadResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(markAllAsReadRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { count, error } = await supabase
    .schema('core')
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('read', false)
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error marking all as read:', error)
    return c.json({ error: 'Failed to mark all as read', message: error.message }, 500)
  }

  return c.json({
    data: {
      updated_count: count || 0,
    },
  })
})

/**
 * DELETE /v1/notifications/:id
 * Delete a notification
 */
const deleteNotificationRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Notifications'],
  summary: 'Delete notification',
  description: 'Delete a specific notification',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: 'Notification deleted',
    },
    404: {
      description: 'Notification not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(deleteNotificationRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { error } = await supabase
    .schema('core')
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting notification:', error)
    return c.json({ error: 'Failed to delete notification', message: error.message }, 500)
  }

  return c.body(null, 204)
})

/**
 * DELETE /v1/notifications
 * Delete all notifications
 */
const deleteAllNotificationsRoute = createRoute({
  method: 'delete',
  path: '/',
  tags: ['Notifications'],
  summary: 'Delete all notifications',
  description: 'Delete all notifications for the authenticated user',
  responses: {
    200: {
      description: 'All notifications deleted',
      content: {
        'application/json': {
          schema: deleteAllResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(deleteAllNotificationsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { count, error } = await supabase
    .schema('core')
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error deleting all notifications:', error)
    return c.json({ error: 'Failed to delete notifications', message: error.message }, 500)
  }

  return c.json({
    data: {
      deleted_count: count || 0,
    },
  })
})

/**
 * GET /v1/notifications/unread-count
 * Get unread notification count
 */
const getUnreadCountRoute = createRoute({
  method: 'get',
  path: '/unread-count',
  tags: ['Notifications'],
  summary: 'Get unread count',
  description: 'Get the count of unread notifications',
  responses: {
    200: {
      description: 'Unread notification count',
      content: {
        'application/json': {
          schema: unreadCountResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getUnreadCountRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { count, error } = await supabase
    .schema('core')
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    console.error('Error getting unread count:', error)
    return c.json({ error: 'Failed to get unread count', message: error.message }, 500)
  }

  return c.json({
    data: {
      unread_count: count || 0,
    },
  })
})

/**
 * GET /v1/notifications/preferences
 * Get notification preferences
 */
const getPreferencesRoute = createRoute({
  method: 'get',
  path: '/preferences',
  tags: ['Notifications'],
  summary: 'Get preferences',
  description: 'Get notification preferences for the authenticated user',
  responses: {
    200: {
      description: 'Notification preferences',
      content: {
        'application/json': {
          schema: preferencesResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getPreferencesRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: preferences, error } = await supabase
    .schema('core')
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching preferences:', error)
    return c.json({ error: 'Failed to fetch preferences', message: error.message }, 500)
  }

  // Create default preferences if they don't exist
  if (!preferences) {
    const { data: newPreferences, error: createError } = await supabase
      .schema('core')
      .from('notification_preferences')
      .insert({
        user_id: user.id,
        email_notifications: true,
        push_notifications: true,
        notification_types: {
          application_status: { email: true, push: true },
          connection_request: { email: true, push: true },
          message: { email: true, push: true },
          job_match: { email: true, push: false },
          system: { email: true, push: true },
        },
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating preferences:', createError)
      return c.json(
        { error: 'Failed to create preferences', message: createError.message },
        500
      )
    }

    return c.json({ data: newPreferences })
  }

  return c.json({ data: preferences })
})

/**
 * PATCH /v1/notifications/preferences
 * Update notification preferences
 */
const updatePreferencesRoute = createRoute({
  method: 'patch',
  path: '/preferences',
  tags: ['Notifications'],
  summary: 'Update preferences',
  description: 'Update notification preferences',
  request: {
    body: {
      content: {
        'application/json': {
          schema: updatePreferencesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Preferences updated',
      content: {
        'application/json': {
          schema: preferencesResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(updatePreferencesRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const updates = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: preferences, error } = await supabase
    .schema('core')
    .from('notification_preferences')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating preferences:', error)
    return c.json({ error: 'Failed to update preferences', message: error.message }, 500)
  }

  return c.json({ data: preferences })
})

export default app
