import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestApp, makePrismaMock } from '@/test/helpers'

const prismaMock = makePrismaMock()
const sendEmailMock = vi.fn()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/email', () => ({
  sendEmailWithValidation: sendEmailMock,
  resend: { emails: { send: vi.fn() } },
}))

const { requestPasswordRecover } = await import('./request-password-recover')

describe('POST /password/recover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 201 silently when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(requestPasswordRecover)

    const response = await app.inject({
      method: 'POST',
      url: '/password/recover',
      payload: { email: 'no-user@test.com' },
    })

    expect(response.statusCode).toBe(201)
    expect(prismaMock.token.create).not.toHaveBeenCalled()
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('creates token and sends e-mail when user exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      name: 'Jane',
    })
    prismaMock.token.create.mockResolvedValue({ id: 'token-1' })
    sendEmailMock.mockResolvedValue({ success: true, id: 'msg-1' })
    const app = await buildTestApp(requestPasswordRecover)

    const response = await app.inject({
      method: 'POST',
      url: '/password/recover',
      payload: { email: 'a@b.com' },
    })

    expect(response.statusCode).toBe(201)
    expect(prismaMock.token.create).toHaveBeenCalledOnce()
    expect(sendEmailMock).toHaveBeenCalledOnce()
  })

  it('returns 400 if email sending fails', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      name: 'Jane',
    })
    prismaMock.token.create.mockResolvedValue({ id: 'token-1' })
    sendEmailMock.mockResolvedValue({ success: false, message: 'failed' })
    const app = await buildTestApp(requestPasswordRecover)

    const response = await app.inject({
      method: 'POST',
      url: '/password/recover',
      payload: { email: 'a@b.com' },
    })

    expect(response.statusCode).toBe(400)
  })
})
