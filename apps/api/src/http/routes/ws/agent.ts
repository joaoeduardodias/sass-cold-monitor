import { env } from '@cold-monitor/env'
import type { FastifyInstance } from 'fastify'
import type WebSocket from 'ws'

import { sendEmailWithValidation } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { dashboardConnectionsByOrg } from '@/realtime/dashboard-connections'
import { createSlug } from '@/utils/create-slug'
import {
  evaluateAlertLevel,
  getNearestLimit,
} from '@/utils/notifications/evaluate-alert-level'
import { handleCreateInstrument } from '@/utils/websocket/create-instruments'
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
const agentConnectionByOrg = new Map<string, WebSocket>()

export async function agentWs(app: FastifyInstance) {
  app.get(
    '/ws/agent',
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
                existingConnection !== (conn as unknown as WebSocket) &&
                existingConnection.readyState === existingConnection.OPEN
              ) {
                conn.send(
                  JSON.stringify({
                    type: 'AUTH_ERROR',
                    message: 'There is already an active agent for this organization',
                  }),
                )
                conn.close()
                return
              }

              authenticatedOrgId = organization.id
              agentConnectionByOrg.set(organization.id, conn as unknown as WebSocket)
              conn.send(JSON.stringify({ type: 'AUTH_OK' }))
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
              if (payload.organizationId !== authenticatedOrgId) {
                conn.send(
                  JSON.stringify({
                    type: 'AUTH_ERROR',
                    message: 'User cannot access this organization',
                  }),
                )
                conn.close()
                return
              }

              const instrument = await handleCreateInstrument(payload)

              conn.send(
                JSON.stringify({
                  type: 'INSTRUMENT_CREATED',
                  payload: {
                    slug: createSlug(instrument.name),
                    instrumentId: instrument.id,
                  },
                }),
              )

              if (instrument?.organizationId) {
                const vm = {
                  instrumentId: instrument.id,
                  name: instrument.name,
                  orderDisplay: instrument.orderDisplay ?? 0,
                  isActive: instrument.isActive ?? true,
                  processStatusText:
                    payload.processStatusText ?? 'Aguardando dados...',
                }

                broadcastToOrg(instrument.organizationId, {
                  type: 'INSTRUMENT_VIEW_MODEL',
                  payload: vm,
                })
              }

              break
            }

            case 'TEMPERATURE_READING': {
              const reading = await handleValuesInstruments({
                readings: payload.readings,
              }, {
                organizationId: authenticatedOrgId,
              })

              broadcastToOrg(authenticatedOrgId, {
                type: 'TEMPERATURE_UPDATE',
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
                    value: r.data,
                    editValue: r.editData,
                    temperature: r.temperature,
                    pressure: r.pressure,
                    setpoint: r.setpoint,
                    differential: r.differential,
                    updatedAt: new Date().toISOString(),
                  },
                })

                const alertLevel = evaluateAlertLevel({
                  value: r.editData,
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
                  value: r.editData,
                  minValue: r.minValue,
                  maxValue: r.maxValue,
                })
                const timestamp = new Date().toISOString()

                if (settings?.pushEnabled ?? true) {
                  broadcastToOrg(orgId, {
                    type: 'ALERT_NOTIFICATION',
                    payload: {
                      instrumentId: r.instrumentId,
                      chamberName: r.instrumentName,
                      alertType,
                      currentValue: String(r.editData),
                      limitValue: String(nearestLimit),
                      timestamp,
                    },
                  })
                }

                if ((settings?.emailEnabled ?? true) && (settings?.emailRecipients?.length ?? 0) > 0) {
                  const emailTemplate =
                    settings?.emailTemplate ??
                    `Alerta ColdMonitor

Câmara: {chamber_name}
Tipo: {alert_type}
Valor: {current_value}
Limite: {limit_value}
Data/Hora: {timestamp}

Verifique o sistema imediatamente.`

                  const text = emailTemplate
                    .replaceAll('{chamber_name}', r.instrumentName)
                    .replaceAll('{alert_type}', alertType)
                    .replaceAll('{current_value}', String(r.editData))
                    .replaceAll('{limit_value}', String(nearestLimit))
                    .replaceAll('{timestamp}', timestamp)

                  const sendResult = await sendEmailWithValidation(
                    {
                      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_EMAIL}>`,
                      to: settings!.emailRecipients,
                      subject: `Alerta ${alertType.toUpperCase()} - ${r.instrumentName}`,
                      text,
                    },
                    'agentWs:TEMPERATURE_READING',
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
