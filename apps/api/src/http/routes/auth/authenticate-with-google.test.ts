import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestApp, makePrismaMock } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { authenticateWithGoogle } = await import('./authenticate-with-google')

const originalFetch = global.fetch

describe('POST /sessions/google', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns 400 when Google token endpoint fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'invalid_grant' }),
    }) as unknown as typeof fetch
    const app = await buildTestApp(authenticateWithGoogle)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/google',
      payload: { code: 'invalid' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('creates user and account on first sign-in', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok', token_type: 'Bearer' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'g-1',
          email: 'user@google.com',
          name: 'Google User',
          picture: 'https://example.com/avatar.jpg',
        }),
      }) as unknown as typeof fetch

    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: 'user-1' })
    prismaMock.account.findUnique.mockResolvedValue(null)
    prismaMock.account.create.mockResolvedValue({ id: 'account-1' })

    const app = await buildTestApp(authenticateWithGoogle)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/google',
      payload: { code: 'valid-code' },
    })

    expect(response.statusCode).toBe(201)
    expect(prismaMock.user.create).toHaveBeenCalledOnce()
    expect(prismaMock.account.create).toHaveBeenCalledOnce()
    expect(response.json().token).toEqual(expect.any(String))
  })

  it('reuses existing user and account', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok', token_type: 'Bearer' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'g-1',
          email: 'user@google.com',
          name: 'Google User',
          picture: null,
        }),
      }) as unknown as typeof fetch

    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' })
    prismaMock.account.findUnique.mockResolvedValue({ id: 'account-1' })

    const app = await buildTestApp(authenticateWithGoogle)

    const response = await app.inject({
      method: 'POST',
      url: '/sessions/google',
      payload: { code: 'valid-code' },
    })

    expect(response.statusCode).toBe(201)
    expect(prismaMock.user.create).not.toHaveBeenCalled()
    expect(prismaMock.account.create).not.toHaveBeenCalled()
  })
})
