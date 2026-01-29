import type { FastifyInstance } from 'fastify'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { dashboardConnectionsByOrg } from '@/realtime/dashboard-connections'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function dashboardWs(app: FastifyInstance) {
  app.register(auth).get(
    '/ws/dashboard',
    {
      schema: {
        tags: ['WebSocket'],
        summary: 'WebSocket endpoint for dashboard.',
        operationId: 'dashboardWs',
      },
      websocket: true,
    },
    (conn, request) => {
      console.log('Dashboard conectado, aguardando AUTH')

      let orgId: string | null = null

      conn.on('message', async (msg: Buffer) => {
        const raw = JSON.parse(msg.toString())

        if (raw.type === 'AUTH') {
          orgId = raw.payload.organizationId
          if (!orgId) {
            conn.send(
              JSON.stringify({
                type: 'AUTH_ERROR',
                message: 'organizationId is required',
              }),
            )
            conn.close()
            return
          }

          const org = await prisma.organization.findUnique({
            where: { id: orgId },
          })
          if (!org) {
            conn.send(
              JSON.stringify({
                type: 'AUTH_ERROR',
                message: 'organization not found',
              }),
            )
            conn.close()
            return
          }

          const userId = await request.getCurrentUserId()
          const { membership } = await request.getUserMembership(org.slug)
          if (!membership) {
            conn.send(
              JSON.stringify({
                type: 'AUTH_ERROR',
                message: 'User is not a member of this organization',
              }),
            )
            conn.close()
            return
          }
          if (membership.organizationId !== org.id) {
            conn.send(
              JSON.stringify({
                type: 'AUTH_ERROR',
                message: 'User cannot access this organization',
              }),
            )
            conn.close()
            return
          }

          const { cannot } = getUserPermissions(userId, membership.role)

          if (cannot('get', 'Instrument')) {
            conn.send(
              JSON.stringify({
                type: 'AUTH_ERROR',
                message: `You're not allowed to see these instruments.`,
              }),
            )
            conn.close()
            return
          }

          if (!dashboardConnectionsByOrg.has(orgId)) {
            dashboardConnectionsByOrg.set(orgId, new Set())
          }

          dashboardConnectionsByOrg.get(orgId)!.add(conn)
          conn.send(JSON.stringify({ type: 'AUTH_OK' }))
        }
      })

      conn.on('close', () => {
        if (orgId && dashboardConnectionsByOrg.has(orgId)) {
          dashboardConnectionsByOrg.get(orgId)!.delete(conn)
          if (dashboardConnectionsByOrg.get(orgId)!.size === 0) {
            dashboardConnectionsByOrg.delete(orgId)
          }
        }
      })
    },
  )
}
