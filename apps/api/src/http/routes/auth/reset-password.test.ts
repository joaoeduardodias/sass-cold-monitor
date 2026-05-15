import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestApp, makePrismaMock } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { resetPassword } = await import('./reset-password')

describe('POST /password/reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when token is invalid', async () => {
    prismaMock.token.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(resetPassword)

    const response = await app.inject({
      method: 'POST',
      url: '/password/reset',
      payload: { code: 'bad-token', password: 'newpass123' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('updates password when token is valid', async () => {
    prismaMock.token.findUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
    })
    prismaMock.user.update.mockResolvedValue({ id: 'user-1' })
    const app = await buildTestApp(resetPassword)

    const response = await app.inject({
      method: 'POST',
      url: '/password/reset',
      payload: { code: 'token-1', password: 'newpass123' },
    })

    expect(response.statusCode).toBe(204)
    expect(prismaMock.user.update).toHaveBeenCalledOnce()
  })

  it('returns 400 when password is too short', async () => {
    const app = await buildTestApp(resetPassword)
    const response = await app.inject({
      method: 'POST',
      url: '/password/reset',
      payload: { code: 'token-1', password: '12' },
    })
    expect(response.statusCode).toBe(400)
  })
})
