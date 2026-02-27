import { env } from '@cold-monitor/env'
import type { FastifyInstance } from 'fastify'
import type WebSocket from 'ws'

import { sendEmailWithValidation } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { agentConnectionByOrg } from '@/realtime/agent-connections'
import { dashboardConnectionsByOrg } from '@/realtime/dashboard-connections'
import {
  evaluateAlertLevel,
  getNearestLimit,
} from '@/utils/notifications/evaluate-alert-level'
import { handleCreateInstruments } from '@/utils/websocket/create-instruments'
import {
  agentEventSchema,
  authAgentPayloadSchema,
} from '@/utils/websocket/schemas/agent'
import { handleValuesInstruments } from '@/utils/websocket/send-values-instruments'

function broadcastToOrg(orgId: string, data: unknown) {
  const conns = dashboardConnectionsByOrg.get(orgId)
  if (!conns) return

  for (const ws of conns) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }
}

const latestAlertLevelByInstrument = new Map<string, 'normal' | 'warning' | 'critical'>()

export async function agentWs(app: FastifyInstance) {
  app.get('/ws/agent',
    {
      schema: {
        tags: ['WebSocket'],
        summary: 'WebSocket endpoint for agents.',
        operationId: 'agentWs',
      },
      websocket: true,
    },
    (conn) => {
      let authenticatedOrgId: string | null = null

      conn.on('message', async (message: Buffer) => {
        try {
          const raw = JSON.parse(message.toString())

          if (raw.type === 'AUTH') {
            const parsedAuth = authAgentPayloadSchema.safeParse(raw.payload)

            if (!parsedAuth.success) {
              conn.send(
                JSON.stringify({
                  type: 'AUTH_ERROR',
                  message: 'Invalid AUTH payload',
                }),
              )
              conn.close()
              return
            }

            const { organizationId, token } = parsedAuth.data
            try {
              const decoded = app.jwt.verify<{ sub: string; organizationId?: string }>(token)
              const userId = decoded.sub
              const tokenOrganizationId = decoded.organizationId
              const resolvedOrganizationId = organizationId ?? tokenOrganizationId

              if (!resolvedOrganizationId) {
                conn.send(
                  JSON.stringify({
                    type: 'AUTH_ERROR',
                    message: 'organizationId is required',
                  }),
                )
                conn.close()
                return
              }

              if (
                tokenOrganizationId &&
                organizationId &&
                tokenOrganizationId !== organizationId
              ) {
                conn.send(
                  JSON.stringify({
                    type: 'AUTH_ERROR',
                    message: 'Invalid organization for this token',
                  }),
                )
                conn.close()
                return
              }

              const organization = await prisma.organization.findUnique({
                where: { id: resolvedOrganizationId },
                select: { id: true },
              })

              if (!organization) {
                conn.send(
                  JSON.stringify({
                    type: 'AUTH_ERROR',
                    message: 'organization not found',
                  }),
                )
                conn.close()
                return
              }

              const membership = await prisma.member.findFirst({
                where: {
                  userId,
                  organizationId: organization.id,
                  isActive: true,
                },
                select: { id: true },
              })

              if (!membership) {
                conn.send(
                  JSON.stringify({
                    type: 'AUTH_ERROR',
                    message: 'User cannot access this organization',
                  }),
                )
                conn.close()
                return
              }

              const collectorDevice = await prisma.collectorDevice.findFirst({
                where: {
                  token,
                  organizationId: organization.id,
                  userId,
                  isActive: true,
                },
                select: {
                  id: true,
                  stopPassword: true,
                },
              })

              if (!collectorDevice?.stopPassword) {
                conn.send(
                  JSON.stringify({
                    type: 'AUTH_ERROR',
                    message: 'Invalid token',
                  }),
                )
                conn.close()
                return
              }

              if (authenticatedOrgId && authenticatedOrgId !== organization.id) {
                conn.send(
                  JSON.stringify({
                    type: 'AUTH_ERROR',
                    message: 'Agent already authenticated for another organization',
                  }),
                )
                conn.close()
                return
              }

              const existingConnection = agentConnectionByOrg.get(organization.id)

              if (
                existingConnection &&
                existingConnection !== (conn as unknown as WebSocket)
              ) {
                if (existingConnection.readyState === existingConnection.OPEN) {
                  existingConnection.close(1000, 'Replaced by a new agent connection')
                }
                agentConnectionByOrg.delete(organization.id)
              }

              authenticatedOrgId = organization.id
              agentConnectionByOrg.set(organization.id, conn as unknown as WebSocket)
              conn.send(JSON.stringify({
                type: 'AUTH_OK',
                payload: {
                  token,
                  organizationId: organization.id,
                  stopPassword: collectorDevice.stopPassword,
                },
              }))
              return
            } catch {
              conn.send(
                JSON.stringify({
                  type: 'AUTH_ERROR',
                  message: 'Invalid auth token.',
                }),
              )
              conn.close()
              return
            }
          }

          if (!authenticatedOrgId) {
            conn.send(
              JSON.stringify({
                type: 'AUTH_ERROR',
                message: 'Authentication required',
              }),
            )
            conn.close()
            return
          }

          const parsed = agentEventSchema.safeParse(raw)

          if (!parsed.success) {
            console.warn('Evento inválido recebido do agent', parsed.error)
            return
          }

          const { type, payload } = parsed.data

          switch (type) {
            case 'AUTH': {
              break
            }

            case 'INSTRUMENT_CREATE': {
              const instrumentsWithoutOrg = payload.filter((inst) => inst.organizationId !== authenticatedOrgId)
              if (instrumentsWithoutOrg.length > 0) {
                conn.send(
                  JSON.stringify({
                    type: 'AUTH_ERROR',
                    message: 'This instrument cannot access this organization',
                  }),
                )
                conn.close()
                return
              }

              const instruments = await handleCreateInstruments(payload)

              const insturmentsMapping = instruments.map((instrument) => {
                return {
                  id: instrument.id,
                  slug: instrument.slug,
                }
              })
              conn.send(
                JSON.stringify({
                  type: 'INSTRUMENT_CREATED',
                  payload: insturmentsMapping,
                }),
              )

              break
            }

            case 'INSTRUMENT_READING': {
              const reading = await handleValuesInstruments(payload)

              broadcastToOrg(authenticatedOrgId, {
                type: 'INSTRUMENT_VALUES',
                payload: reading,
              })

              const orgIds = Array.from(
                new Set(reading.map((r) => r.organizationId).filter(Boolean)),
              )
              const settingsRows = await prisma.notificationSettings.findMany({
                where: {
                  organizationId: {
                    in: orgIds,
                  },
                },
                select: {
                  organizationId: true,
                  emailEnabled: true,
                  emailRecipients: true,
                  pushEnabled: true,
                  criticalAlerts: true,
                  warningAlerts: true,
                  emailTemplate: true,
                },
              })
              const settingsByOrg = new Map(
                settingsRows.map((item) => [item.organizationId, item]),
              )

              for (const r of reading) {
                const orgId = r.organizationId
                if (!orgId) continue
                broadcastToOrg(orgId, {
                  type: 'INSTRUMENT_UPDATE',
                  payload: {
                    instrumentId: r.instrumentId,
                    idSitrad: r.idSitrad,
                    name: r.name,
                    slug: r.slug,
                    model: r.model,
                    type: r.type,
                    status: r.status,
                    isFan: r.isFan,
                    isSensorError: r.isSensorError,
                    value: r.value,
                    editValue: r.value,
                    minValue: r.minValue,
                    maxValue: r.maxValue,
                    setpoint: r.setPoint,
                    differential: r.differential,
                    updatedAt: new Date().toISOString(),
                  },
                })

                const alertLevel = evaluateAlertLevel({
                  value: r.value,
                  minValue: r.minValue,
                  maxValue: r.maxValue,
                })
                const lastLevel =
                  latestAlertLevelByInstrument.get(r.instrumentId) ?? 'normal'

                if (alertLevel === lastLevel) {
                  continue
                }

                latestAlertLevelByInstrument.set(r.instrumentId, alertLevel)

                if (alertLevel === 'normal') {
                  continue
                }

                const settings = settingsByOrg.get(orgId)
                const canNotifyWarning =
                  alertLevel === 'warning' && (settings?.warningAlerts ?? true)
                const canNotifyCritical =
                  alertLevel === 'critical' && (settings?.criticalAlerts ?? true)

                if (!canNotifyWarning && !canNotifyCritical) {
                  continue
                }

                const alertType = alertLevel === 'critical' ? 'critical' : 'warning'
                const nearestLimit = getNearestLimit({
                  value: r.value,
                  minValue: r.minValue,
                  maxValue: r.maxValue,
                })
                const timestamp = new Date().toISOString()

                if (settings?.pushEnabled ?? true) {
                  broadcastToOrg(orgId, {
                    type: 'ALERT_NOTIFICATION',
                    payload: {
                      instrumentId: r.instrumentId,
                      instrumentName: r.name,
                      alertType,
                      currentValue: r.value,
                      limitValue: nearestLimit,
                      timestamp,
                    },
                  })
                }

                if ((settings?.emailEnabled ?? true)
                  && (settings?.emailRecipients?.length ?? 0) > 0) {
                  const emailTemplate =
                    settings?.emailTemplate ??
                    `Alerta ColdMonitor

Instrumento: {instrument_name}
Tipo: {alert_type}
Valor: {current_value}
Limite: {limit_value}
Data/Hora: {timestamp}

Verifique o sistema imediatamente.`

                  const text = emailTemplate
                    .replaceAll('{instrument_name}', r.name)
                    .replaceAll('{alert_type}', alertType)
                    .replaceAll('{current_value}', String(r.value))
                    .replaceAll('{limit_value}', String(nearestLimit))
                    .replaceAll('{timestamp}', timestamp)

                  const sendResult = await sendEmailWithValidation(
                    {
                      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_EMAIL}>`,
                      to: settings!.emailRecipients,
                      subject: `Alerta ${alertType.toUpperCase()} - ${r.name}`,
                      text,
                    },
                    'agentWs:instrument_Reading',
                  )

                  if (!sendResult.success) {
                    console.error(sendResult.message)
                  }
                }
              }

              break
            }
          }
        } catch (err) {
          console.error('Erro no WS do agent:', err)
        }
      })

      conn.on('close', () => {
        if (
          authenticatedOrgId &&
          agentConnectionByOrg.get(authenticatedOrgId) === (conn as unknown as WebSocket)
        ) {
          agentConnectionByOrg.delete(authenticatedOrgId)
        }

        console.log('Agent desconectado')
      })
    },
  )
}
