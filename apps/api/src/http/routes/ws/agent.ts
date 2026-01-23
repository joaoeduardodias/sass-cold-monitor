import type { FastifyInstance } from 'fastify'

import { dashboardConnections } from '@/realtime/dashboard-connections'
import { createSlug } from '@/utils/create-slug'
import { handleCreateInstrument } from '@/utils/websocket/create-instruments'
import { agentEventSchema } from '@/utils/websocket/schemas/agent'
import { handleValuesInstruments } from '@/utils/websocket/send-values-instruments'

export async function agentWs(app: FastifyInstance) {
  app.get('/ws/agent', { websocket: true }, (conn) => {
    console.log('Agent conectado')

    conn.on('message', async (message: Buffer) => {
      try {
        const raw = JSON.parse(message.toString())
        console.log(raw)
        const parsed = agentEventSchema.safeParse(raw)

        if (!parsed.success) {
          console.warn(
            'Evento inválido recebido do agent',
            parsed.error.format(),
          )
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
            console.log('Instrument sincronizado:', instrument.id)
            break
          }

          case 'TEMPERATURE_READING': {
            const reading = await handleValuesInstruments(payload)

            dashboardConnections.forEach((ws) => {
              ws.send(
                JSON.stringify({
                  type: 'TEMPERATURE_UPDATE',
                  payload: reading,
                }),
              )
            })

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
  })
}
