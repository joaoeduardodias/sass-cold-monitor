import bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestApp, makePrismaMock } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { authenticateWithPassword } = await import('./authenticate-with-password')

describe('POST /sessions/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when user is not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(authenticateWithPassword)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: { email: 'unknown@test.com', password: 'secret123' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ message: 'Invalid credentials.' })
  })

  it('returns 400 when user has no password set', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      passwordHash: null,
    })
    const app = await buildTestApp(authenticateWithPassword)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: { email: 'a@b.com', password: 'secret123' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toMatch(/social login/i)
  })

  it('returns 400 when password is incorrect', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      passwordHash: await bcrypt.hash('correct-password', 6),
    })
    const app = await buildTestApp(authenticateWithPassword)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: { email: 'a@b.com', password: 'wrong-password' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ message: 'Invalid credentials.' })
  })

  it('returns 201 with token on valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      passwordHash: await bcrypt.hash('correct-password', 6),
    })
    const app = await buildTestApp(authenticateWithPassword)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: { email: 'a@b.com', password: 'correct-password' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().token).toEqual(expect.any(String))
  })

  it('returns 400 when body is invalid', async () => {
    const app = await buildTestApp(authenticateWithPassword)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/password',
      payload: { email: 'not-an-email', password: '123' },
    })

    expect(response.statusCode).toBe(400)
  })
})
