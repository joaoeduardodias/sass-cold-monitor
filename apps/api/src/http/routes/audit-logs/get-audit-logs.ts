import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

const auditEventTypes = ['SYSTEM', 'MEMBER', 'INVITE', 'INSTRUMENT', 'DATA', 'NOTIFICATION', 'ALERT'] as const

type AuditEventType = (typeof auditEventTypes)[number]

type AuditLogItem = {
  id: string
  timestamp: Date
  organizationSlug: string
  organizationName: string
  type: AuditEventType
  action: string
  details: string
  actor: string | null
  status: 'success' | 'failed'
}

type AlertReadLogRow = {
  id: string
  createdAt: Date
  severity: string
  value: number
  minThreshold: number
  maxThreshold: number
  thresholdType: string
  actorName: string | null
  actorEmail: string
  instrumentName: string
}

const parseDateRange = (startDate?: Date, endDate?: Date) => {
  const now = new Date()
  const end = endDate ?? now
  const start =
    startDate ??
    new Date(end.getTime() - 1000 * 60 * 60 * 24 * 7)

  return { start, end }
}

const includesFilter = (value: string | null | undefined, filter?: string) => {
  if (!filter?.trim()) return true
  return (value ?? '').toLowerCase().includes(filter.trim().toLowerCase())
}

export async function getAuditLogs(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:orgSlug/audit-logs',
      {
        schema: {
          tags: ['Security'],
          summary: 'Get organization audit logs',
          operationId: 'getAuditLogs',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
          }),
          querystring: z.object({
            startDate: z.coerce.date().optional(),
            endDate: z.coerce.date().optional(),
            type: z.enum(auditEventTypes).optional(),
            actor: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            pageSize: z.coerce.number().int().min(1).max(1000).default(25),
          }),
          response: {
            200: z.object({
              logs: z.array(
                z.object({
                  id: z.string(),
                  timestamp: z.date(),
                  organizationSlug: z.string(),
                  organizationName: z.string(),
                  type: z.enum(auditEventTypes),
                  action: z.string(),
                  details: z.string(),
                  actor: z.string().nullable(),
                  status: z.enum(['success', 'failed']),
                }),
              ),
              pagination: z.object({
                page: z.number().int().min(1),
                pageSize: z.number().int().min(1),
                total: z.number().int().min(0),
                totalPages: z.number().int().min(1),
                hasNextPage: z.boolean(),
                hasPreviousPage: z.boolean(),
              }),
            }),
          },
        },
      },
      async (request) => {
        const { orgSlug } = request.params
        const { startDate, endDate, page, pageSize, type, actor } = request.query

        const { organization } = await request.getUserMembership(orgSlug)
        const { start, end } = parseDateRange(startDate, endDate)

        const baseRangeFilter = {
          gte: start,
          lte: end,
        }

        const [members, invites, instruments, dataEdits, notificationSettings, organizationSnapshot, alertReads] =
          await Promise.all([
            prisma.member.findMany({
              where: {
                organizationId: organization.id,
                createdAt: baseRangeFilter,
              },
              select: {
                id: true,
                createdAt: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                role: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            }),
            prisma.invite.findMany({
              where: {
                organizationId: organization.id,
                createdAt: baseRangeFilter,
              },
              select: {
                id: true,
                createdAt: true,
                email: true,
                role: true,
                author: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            }),
            prisma.instrument.findMany({
              where: {
                organizationId: organization.id,
                OR: [
                  {
                    createdAt: baseRangeFilter,
                  },
                  {
                    updatedAt: baseRangeFilter,
                  },
                ],
              },
              select: {
                id: true,
                name: true,
                type: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                updatedAt: 'desc',
              },
            }),
            prisma.instrumentData.findMany({
              where: {
                createdAt: baseRangeFilter,
                userEditData: {
                  not: null,
                },
                instrument: {
                  organizationId: organization.id,
                },
              },
              select: {
                id: true,
                createdAt: true,
                editData: true,
                userEditData: true,
                instrument: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            }),
            prisma.notificationSettings.findUnique({
              where: {
                organizationId: organization.id,
              },
              select: {
                id: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
            prisma.organization.findUnique({
              where: {
                id: organization.id,
              },
              select: {
                id: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
            prisma.$queryRaw<AlertReadLogRow[]>`
              SELECT
                arl.id,
                arl.created_at AS "createdAt",
                arl.severity,
                arl.value,
                arl.min_threshold AS "minThreshold",
                arl.max_threshold AS "maxThreshold",
                arl.threshold_type AS "thresholdType",
                u.name AS "actorName",
                u.email AS "actorEmail",
                i.name AS "instrumentName"
              FROM alert_read_logs arl
              INNER JOIN users u ON u.id = arl.user_id
              INNER JOIN instruments i ON i.id = arl.instrument_id
              WHERE arl.organization_id = ${organization.id}
                AND arl.created_at >= ${start}
                AND arl.created_at <= ${end}
              ORDER BY arl.created_at DESC
            `,
          ])

        const logs: AuditLogItem[] = []

        for (const member of members) {
          logs.push({
            id: `member:${member.id}`,
            timestamp: member.createdAt,
            organizationSlug: organization.slug,
            organizationName: organization.name,
            type: 'MEMBER',
            action: 'Membro adicionado',
            details: `${member.user.name} entrou na organização com perfil ${member.role}`,
            actor: member.user.name ?? member.user.email,
            status: 'success',
          })
        }

        for (const invite of invites) {
          logs.push({
            id: `invite:${invite.id}`,
            timestamp: invite.createdAt,
            organizationSlug: organization.slug,
            organizationName: organization.name,
            type: 'INVITE',
            action: 'Convite criado',
            details: `Convite enviado para ${invite.email} com perfil ${invite.role}`,
            actor: invite.author?.name ?? invite.author?.email ?? null,
            status: 'success',
          })
        }

        for (const instrument of instruments) {
          if (instrument.createdAt >= start && instrument.createdAt <= end) {
            logs.push({
              id: `instrument:create:${instrument.id}`,
              timestamp: instrument.createdAt,
              organizationSlug: organization.slug,
              organizationName: organization.name,
              type: 'INSTRUMENT',
              action: 'Instrumento criado',
              details: `${instrument.name} (${instrument.type}) foi criado`,
              actor: null,
              status: 'success',
            })
          }

          if (
            instrument.updatedAt >= start &&
            instrument.updatedAt <= end &&
            instrument.updatedAt.getTime() !== instrument.createdAt.getTime()
          ) {
            logs.push({
              id: `instrument:update:${instrument.id}`,
              timestamp: instrument.updatedAt,
              organizationSlug: organization.slug,
              organizationName: organization.name,
              type: 'INSTRUMENT',
              action: 'Instrumento atualizado',
              details: `${instrument.name} (${instrument.type}) foi atualizado`,
              actor: null,
              status: 'success',
            })
          }
        }

        for (const edit of dataEdits) {
          logs.push({
            id: `data:${edit.id}`,
            timestamp: edit.createdAt,
            organizationSlug: organization.slug,
            organizationName: organization.name,
            type: 'DATA',
            action: 'Leitura alterada manualmente',
            details: `Valor ajustado para ${edit.editData.toFixed(2)} em ${edit.instrument.name}`,
            actor: edit.userEditData,
            status: 'success',
          })
        }

        if (notificationSettings) {
          if (notificationSettings.createdAt >= start && notificationSettings.createdAt <= end) {
            logs.push({
              id: `notification:create:${notificationSettings.id}`,
              timestamp: notificationSettings.createdAt,
              organizationSlug: organization.slug,
              organizationName: organization.name,
              type: 'NOTIFICATION',
              action: 'Configuração de notificação criada',
              details: 'As configurações de notificação foram inicializadas',
              actor: null,
              status: 'success',
            })
          }

          if (
            notificationSettings.updatedAt >= start &&
            notificationSettings.updatedAt <= end &&
            notificationSettings.updatedAt.getTime() !== notificationSettings.createdAt.getTime()
          ) {
            logs.push({
              id: `notification:update:${notificationSettings.id}`,
              timestamp: notificationSettings.updatedAt,
              organizationSlug: organization.slug,
              organizationName: organization.name,
              type: 'NOTIFICATION',
              action: 'Configuração de notificação atualizada',
              details: 'As configurações de notificação foram alteradas',
              actor: null,
              status: 'success',
            })
          }
        }

        if (organizationSnapshot) {
          if (organizationSnapshot.createdAt >= start && organizationSnapshot.createdAt <= end) {
            logs.push({
              id: `organization:create:${organizationSnapshot.id}`,
              timestamp: organizationSnapshot.createdAt,
              organizationSlug: organization.slug,
              organizationName: organization.name,
              type: 'SYSTEM',
              action: 'Organização criada',
              details: `A organização ${organization.name} foi criada`,
              actor: null,
              status: 'success',
            })
          }

          if (
            organizationSnapshot.updatedAt >= start &&
            organizationSnapshot.updatedAt <= end &&
            organizationSnapshot.updatedAt.getTime() !== organizationSnapshot.createdAt.getTime()
          ) {
            logs.push({
              id: `organization:update:${organizationSnapshot.id}`,
              timestamp: organizationSnapshot.updatedAt,
              organizationSlug: organization.slug,
              organizationName: organization.name,
              type: 'SYSTEM',
              action: 'Organização atualizada',
              details: `Dados da organização ${organization.name} foram alterados`,
              actor: null,
              status: 'success',
            })
          }
        }

        for (const alertRead of alertReads) {
          const severityLabel = alertRead.severity === 'critical' ? 'crítico' : 'atenção'
          const thresholdLabel =
            alertRead.thresholdType === 'max'
              ? `máximo ${alertRead.maxThreshold.toFixed(2)}`
              : `mínimo ${alertRead.minThreshold.toFixed(2)}`

          logs.push({
            id: `alert:read:${alertRead.id}`,
            timestamp: alertRead.createdAt,
            organizationSlug: organization.slug,
            organizationName: organization.name,
            type: 'ALERT',
            action: 'Alerta marcado como lido',
            details: `${alertRead.instrumentName}: alerta ${severityLabel} marcado como lido (valor ${alertRead.value.toFixed(2)}, limite ${thresholdLabel})`,
            actor: alertRead.actorName ?? alertRead.actorEmail,
            status: 'success',
          })
        }

        const filtered = logs
          .filter((log) => (type ? log.type === type : true))
          .filter((log) => includesFilter(log.actor, actor))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        const total = filtered.length
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        const safePage = Math.min(page, totalPages)
        const offset = (safePage - 1) * pageSize
        const paginated = filtered.slice(offset, offset + pageSize)

        return {
          logs: paginated,
          pagination: {
            page: safePage,
            pageSize,
            total,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPreviousPage: safePage > 1,
          },
        }
      },
    )
}
