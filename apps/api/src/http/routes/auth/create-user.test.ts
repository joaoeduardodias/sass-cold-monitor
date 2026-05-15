import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestApp, makePrismaMock } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { createUser } = await import('./create-user')

describe('POST /users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' })
    const app = await buildTestApp(createUser)

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'John', email: 'a@b.com', password: 'secret123' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toMatch(/already exists/i)
  })

  it('returns 201 and creates user without auto-join when domain not configured', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    prismaMock.organization.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: 'user-1' })
    const app = await buildTestApp(createUser)

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'John', email: 'a@b.com', password: 'secret123' },
    })

    expect(response.statusCode).toBe(201)
    expect(prismaMock.user.create).toHaveBeenCalledOnce()
    const arg = prismaMock.user.create.mock.calls[0][0]
    expect(arg.data.member_on).toBeUndefined()
  })

  it('attaches user to organization when domain matches', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    prismaMock.organization.findUnique.mockResolvedValue({ id: 'org-1' })
    prismaMock.user.create.mockResolvedValue({ id: 'user-1' })
    const app = await buildTestApp(createUser)

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'John', email: 'john@acme.com', password: 'secret123' },
    })

    expect(response.statusCode).toBe(201)
    const arg = prismaMock.user.create.mock.calls[0][0]
    expect(arg.data.member_on).toEqual({
      create: { organizationId: 'org-1' },
    })
  })

  it('returns 400 on invalid payload', async () => {
    const app = await buildTestApp(createUser)
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: '', email: 'not-email', password: '1' },
    })
    expect(response.statusCode).toBe(400)
  })
})
