import type WebSocket from 'ws'

export const dashboardConnectionsByOrg = new Map<string, Set<WebSocket>>()
