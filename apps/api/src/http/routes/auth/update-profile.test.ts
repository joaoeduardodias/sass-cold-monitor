import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { updateProfile } = await import('./update-profile')

describe('PUT /profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(updateProfile)
    const response = await app.inject({
      method: 'PUT',
      url: '/profile',
      payload: { name: 'New', email: 'new@test.com', avatarUrl: null },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 if email belongs to another user', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'other' })
    const app = await buildTestApp(updateProfile)
    const token = await signToken(app, { sub: 'user-1' })

    const response = await app.inject({
      method: 'PUT',
      url: '/profile',
      headers: authHeaders(token),
      payload: { name: 'New', email: 'new@test.com', avatarUrl: null },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toMatch(/already in use/i)
  })

  it('updates user profile', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)
    prismaMock.user.update.mockResolvedValue({
      id: uuid('user'),
      name: 'New',
      email: 'new@test.com',
      avatarUrl: null,
    })
    const app = await buildTestApp(updateProfile)
    const token = await signToken(app, { sub: uuid('user') })

    const response = await app.inject({
      method: 'PUT',
      url: '/profile',
      headers: authHeaders(token),
      payload: { name: 'New', email: 'new@test.com', avatarUrl: null },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().user.email).toBe('new@test.com')
  })
})
