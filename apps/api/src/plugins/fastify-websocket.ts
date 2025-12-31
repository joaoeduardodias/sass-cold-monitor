import websocket from '@fastify/websocket'
import fp from 'fastify-plugin'

export default fp(async (app) => {
  app.register(websocket)
})
