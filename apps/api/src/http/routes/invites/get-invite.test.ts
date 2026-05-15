import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTestApp, makePrismaMock, uuid } from '@/test/helpers'

const prismaMock = makePrismaMock()

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const { getInvite } = await import('./get-invite')

describe('GET /invites/:inviteId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when invite not found', async () => {
    prismaMock.invite.findUnique.mockResolvedValue(null)
    const app = await buildTestApp(getInvite)
    const response = await app.inject({
      method: 'GET',
      url: `/invites/${uuid('inv')}`,
    })
    expect(response.statusCode).toBe(400)
  })

  it('returns invite details', async () => {
    prismaMock.invite.findUnique.mockResolvedValue({
      id: uuid('inv'),
      email: 'a@b.com',
      role: 'EDITOR',
      createdAt: new Date(),
      author: { id: uuid('user'), name: 'Jane', avatarUrl: null },
      organization: { name: 'Acme', slug: 'acme' },
    })
    const app = await buildTestApp(getInvite)
    const response = await app.inject({
      method: 'GET',
      url: `/invites/${uuid('inv')}`,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().invite.email).toBe('a@b.com')
  })
})
