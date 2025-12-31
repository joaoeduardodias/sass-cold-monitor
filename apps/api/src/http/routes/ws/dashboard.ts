import type { FastifyInstance } from 'fastify'

import { dashboardConnections } from '@/realtime/dashboard-connections'

export async function dashboardWs(app: FastifyInstance) {
  app.get('/ws/dashboard', { websocket: true }, (conn) => {
    console.log('Dashboard conectado')

    dashboardConnections.add(conn)

    conn.on('close', () => {
      dashboardConnections.delete(conn)
      console.log('Dashboard desconectado')
    })
  })
}
