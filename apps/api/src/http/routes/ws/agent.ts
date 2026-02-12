import { env } from '@cold-monitor/env'
import type { FastifyInstance } from 'fastify'

import { sendEmailWithValidation } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { dashboardConnectionsByOrg } from '@/realtime/dashboard-connections'
import { createSlug } from '@/utils/create-slug'
import {
  evaluateAlertLevel,
  getNearestLimit,
} from '@/utils/notifications/evaluate-alert-level'
import { handleCreateInstrument } from '@/utils/websocket/create-instruments'
import { agentEventSchema } from '@/utils/websocket/schemas/agent'
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
      conn.on('message', async (message: Buffer) => {
        try {
          const raw = JSON.parse(message.toString())
          const parsed = agentEventSchema.safeParse(raw)

          if (!parsed.success) {
            console.warn('Evento inválido recebido do agent', parsed.error)
            return
          }

          const { type, payload } = parsed.data

          switch (type) {
            case 'INSTRUMENT_CREATE': {
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
              })

              dashboardConnectionsByOrg.forEach((set) => {
                set.forEach((ws) => {
                  if (ws.readyState === ws.OPEN) {
                    ws.send(
                      JSON.stringify({
                        type: 'TEMPERATURE_UPDATE',
                        payload: reading,
                      }),
                    )
                  }
                })
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
        console.log('Agent desconectado')
      })
    },
  )
}
