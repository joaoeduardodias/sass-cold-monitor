import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authHeaders, buildTestApp, makePrismaMock, signToken, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()
const sendEmailMock = vi.fn()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/email', () => ({
  sendEmailWithValidation: sendEmailMock,
  resend: { emails: { send: vi.fn() } },
}))

const { createOrganization } = await import('./create-organization')

describe('POST /organization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendEmailMock.mockResolvedValue({ success: true, id: 'msg-1' })
  })

  it('returns 401 without token', async () => {
    const app = await buildTestApp(createOrganization)
    const response = await app.inject({
      method: 'POST',
      url: '/organization',
      payload: { name: 'Acme' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('returns 400 if user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(createOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organization',
      headers: authHeaders(token),
      payload: { name: 'Acme' },
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns 400 when domain already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      email: 'a@b.com',
      name: 'Jane',
    })
    prismaMock.organization.findUnique.mockResolvedValueOnce({ id: 'existing' })
    const app = await buildTestApp(createOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organization',
      headers: authHeaders(token),
      payload: { name: 'Acme', domain: 'acme.com' },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json().message).toMatch(/domain/i)
  })

  it('creates organization, sends email, returns 201', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      email: 'a@b.com',
      name: 'Jane',
    })
    prismaMock.organization.create.mockResolvedValue({
      id: uuid('org'),
      name: 'Acme',
      slug: 'acme',
    })
    const app = await buildTestApp(createOrganization)
    const token = await signToken(app, { sub: uuid('user') })
    const response = await app.inject({
      method: 'POST',
      url: '/organization',
      headers: authHeaders(token),
      payload: { name: 'Acme' },
    })
    expect(response.statusCode).toBe(201)
    expect(response.json().organizationId).toBe(uuid('org'))
    expect(sendEmailMock).toHaveBeenCalledOnce()
  })
})
