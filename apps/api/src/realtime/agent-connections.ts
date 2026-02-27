import type WebSocket from 'ws'

export const agentConnectionByOrg = new Map<string, WebSocket>()
