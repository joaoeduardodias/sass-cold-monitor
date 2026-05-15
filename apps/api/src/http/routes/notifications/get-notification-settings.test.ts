import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getNotificationSettings } = await import('./get-notification-settings')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER') {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: { id: uuid('org'), slug: 'acme', name: 'Acme' },
  }
}

describe('GET /organizations/:slug/notification-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(getNotificationSettings)
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/notification-settings',
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns defaults when no row exists', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.notificationSettings.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(getNotificationSettings)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/notification-settings',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().settings.emailEnabled).toBe(true)
  })

  it('returns persisted settings', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.notificationSettings.findUnique.mockResolvedValue({
      emailEnabled: false,
      emailRecipients: ['a@b.com'],
      pushEnabled: false,
      criticalAlerts: true,
      warningAlerts: false,
      emailTemplate: 'Custom',
    })
    const app = await buildTestApp(getNotificationSettings)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'GET',
      url: '/organizations/acme/notification-settings',
      headers: authHeaders(token),
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().settings).toMatchObject({
      emailEnabled: false,
      emailRecipients: ['a@b.com'],
    })
  })
})
