import { describe, expect, it } from 'vitest'

import { uploadAvatarInputSchema } from '../consolidated'

const base64Jpeg =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhISEhIVFRUVFRUVFRUVFRUVFRcWFhUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lICYtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKgBLAMBIgACEQEDEQH/xAAcAAEAAgMBAQEAAAAAAAAAAAAABQYDBAcCAQj/xABCEAABAwIEAwUFBQYEBwEAAAABAAIRAyEEEjFBBVFhBiJxgZGh8BMysdHhQhQjQlJy4SNDYnKC0uHwFlODk6LxFRY0Q3Sj8RY0gpOztJPC4v/EABoBAAIDAQEAAAAAAAAAAAAAAAIDAQQFAAb/xAA4EQACAQIEAwYEBQQDAAAAAAAAAQIDEQQSITEFE0FhFDJxgaGxwfAUIkKhscHR4SNS8SNC8f/aAAwDAQACEQMRAD8A9xREQEREBERAREQEREBERAREQEREBERAREQEREBERA//Z'

describe('uploadAvatarInputSchema', () => {
  it('accepts a valid payload', () => {
    const result = uploadAvatarInputSchema.safeParse({
      file: base64Jpeg,
      fileName: 'avatar-123.jpg',
      contentType: 'image/jpeg',
    })
    expect(result.success).toBe(true)
  })

  it('rejects oversized payloads', () => {
    const oversized = `data:image/jpeg;base64,${'a'.repeat(13_421_773)}`
    const result = uploadAvatarInputSchema.safeParse({
      file: oversized,
      fileName: 'avatar-oversized.jpg',
      contentType: 'image/jpeg',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('under 10MB')
    }
  })

  it('rejects unsupported content types', () => {
    const result = uploadAvatarInputSchema.safeParse({
      file: base64Jpeg,
      fileName: 'avatar.gif',
      contentType: 'image/gif',
    })
    expect(result.success).toBe(false)
  })

  it('rejects filenames without valid extension', () => {
    const result = uploadAvatarInputSchema.safeParse({
      file: base64Jpeg,
      fileName: 'avatar',
      contentType: 'image/jpeg',
    })
    expect(result.success).toBe(false)
  })
})

