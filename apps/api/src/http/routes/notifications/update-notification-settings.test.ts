import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { updateNotificationSettings } = await import('./update-notification-settings')

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
  emailEnabled: true,
  emailRecipients: ['a@b.com'],
  pushEnabled: true,
  criticalAlerts: true,
  warningAlerts: true,
  emailTemplate: 'Hello {chamber_name}',
}

describe('PUT /organizations/:slug/notification-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(updateNotificationSettings)
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/notification-settings',
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for viewer', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(updateNotificationSettings)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/notification-settings',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('upserts settings for admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('ADMIN'))
    prismaMock.notificationSettings.upsert.mockResolvedValue({})
    const app = await buildTestApp(updateNotificationSettings)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'PUT',
      url: '/organizations/acme/notification-settings',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(204)
    expect(prismaMock.notificationSettings.upsert).toHaveBeenCalledOnce()
  })
})
