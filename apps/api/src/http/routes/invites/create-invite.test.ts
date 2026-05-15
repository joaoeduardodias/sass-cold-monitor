import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()
const sendEmailMock = vi.fn()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/email', () => ({
  sendEmailWithValidation: sendEmailMock,
  resend: { emails: { send: vi.fn() } },
}))

const { createInvite } = await import('./create-invite')

function asMember(role: 'ADMIN' | 'EDITOR' | 'OPERATOR' | 'VIEWER', shouldAttach = false, domain: string | null = null) {
  return {
    id: uuid('memb'),
    role,
    organizationId: uuid('org'),
    userId: uuid('user'),
    organization: {
      id: uuid('org'),
      slug: 'acme',
      name: 'Acme',
      domain,
      shouldAttachUsersByDomain: shouldAttach,
    },
  }
}

const payload = { email: 'invitee@test.com', role: 'EDITOR' as const }

describe('POST /organizations/:slug/invites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendEmailMock.mockResolvedValue({ success: true, id: 'msg-1' })
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(createInvite)
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/invites',
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 401 for non-admin', async () => {
    prismaMock.member.findFirst.mockResolvedValue(asMember('VIEWER'))
    const app = await buildTestApp(createInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/invites',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when domain auto-joins users', async () => {
    prismaMock.member.findFirst.mockResolvedValue(
      asMember('ADMIN', true, 'test.com'),
    )
    const app = await buildTestApp(createInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/invites',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 400 if invite with same email exists', async () => {
    prismaMock.member.findFirst.mockResolvedValueOnce(asMember('ADMIN'))
    prismaMock.invite.findUnique.mockResolvedValue({ id: 'existing' })
    const app = await buildTestApp(createInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/invites',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(400)
  })

  it('creates invite for admin', async () => {
    prismaMock.member.findFirst
      .mockResolvedValueOnce(asMember('ADMIN'))
      .mockResolvedValueOnce(null)
    prismaMock.invite.findUnique.mockResolvedValue(null)
    prismaMock.invite.create.mockResolvedValue({
      id: uuid('inv'),
      email: payload.email,
    })
    const app = await buildTestApp(createInvite)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organizations/acme/invites',
      headers: authHeaders(token),
      payload,
    })
    expect(response.statusCode).toBe(201)
    expect(sendEmailMock).toHaveBeenCalledOnce()
  })
})
