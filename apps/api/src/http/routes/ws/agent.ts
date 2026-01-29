import type { FastifyInstance } from 'fastify'

import { prisma } from '@/lib/prisma'
import { dashboardConnectionsByOrg } from '@/realtime/dashboard-connections'
import { createSlug } from '@/utils/create-slug'
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

async function findOrgFromReading(instrumentId: string) {
  const inst = await prisma.instrument.findUnique({
    where: { id: instrumentId },
    select: { organizationId: true },
  })

  return inst?.organizationId ?? null
}

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

              for (const r of reading) {
                const orgId = await findOrgFromReading(r.instrumentId)

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
