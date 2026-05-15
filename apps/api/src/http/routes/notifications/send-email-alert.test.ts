import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()
const sendEmailMock = vi.fn()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/email', () => ({
  sendEmailWithValidation: sendEmailMock,
  resend: { emails: { send: vi.fn() } },
}))

const { sendEmailAlert } = await import('./send-email-alert')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

const payload = {
  alertType: 'critical' as const,
  chamberName: 'Camara 1',
  currentValue: '12',
  limitValue: '10',
}

describe('POST /organizations/:slug/alerts/email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(sendEmailAlert)
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/alerts/email',
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns sent=false when email notifications disabled', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.notificationSettings.findUnique.mockResolvedValue({
      emailEnabled: false,
      emailRecipients: ['a@b.com'],
      criticalAlerts: true,
      warningAlerts: true,
      emailTemplate: 'x',
    })
    const app = await buildTestApp(sendEmailAlert)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/alerts/email',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ sent: false, reason: 'email_notifications_disabled' })
  })

  it('returns sent=false when no recipients configured', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.notificationSettings.findUnique.mockResolvedValue({
      emailEnabled: true,
      emailRecipients: [],
      criticalAlerts: true,
      warningAlerts: true,
      emailTemplate: 'x',
    })
    const app = await buildTestApp(sendEmailAlert)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/alerts/email',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().reason).toBe('no_recipients_configured')
  })

  it('sends email when configured and reachable', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.notificationSettings.findUnique.mockResolvedValue({
      emailEnabled: true,
      emailRecipients: ['a@b.com'],
      criticalAlerts: true,
      warningAlerts: true,
      emailTemplate: 'Alerta {chamber_name}',
    })
    sendEmailMock.mockResolvedValue({ success: true, id: 'msg-1' })
    const app = await buildTestApp(sendEmailAlert)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/alerts/email',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().sent).toBe(true)
    expect(sendEmailMock).toHaveBeenCalledOnce()
  })
})
