import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()
const sendEmailMock = vi.fn()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/email', () => ({
  sendEmailWithValidation: sendEmailMock,
  resend: { emails: { send: vi.fn() } },
}))

const { testEmailNotification } = await import('./test-email-notification')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('POST /organizations/:slug/notification-settings/test-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(testEmailNotification)
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/notification-settings/test-email',
      payload: { recipients: ['a@b.com'] },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(testEmailNotification)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/notification-settings/test-email',
      headers: authHeaders(token),
      payload: { recipients: ['a@b.com'] },
    })
    expect(response.statusCode).toBe(401)
  })

  it('sends test email for admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    sendEmailMock.mockResolvedValue({ success: true, id: 'msg-1' })
    const app = await buildTestApp(testEmailNotification)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/notification-settings/test-email',
      headers: authHeaders(token),
      payload: { recipients: ['a@b.com'] },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().sent).toBe(true)
  })

  it('returns 400 when email fails', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    sendEmailMock.mockResolvedValue({ success: false, message: 'oops' })
    const app = await buildTestApp(testEmailNotification)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/notification-settings/test-email',
      headers: authHeaders(token),
      payload: { recipients: ['a@b.com'] },
    })
    expect(response.statusCode).toBe(400)
  })
})
