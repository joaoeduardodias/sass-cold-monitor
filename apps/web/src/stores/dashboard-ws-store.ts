"use client"

import type { DashboardWsMessage } from "@/components/instrument-grid.types"
import { getCookie } from "cookies-next"
import { create } from "zustand"

type MessageListener = (message: DashboardWsMessage) => void

type ConnectionEntry = {
  connected: boolean
  ws: WebSocket | null
  listeners: Set<MessageListener>
  subscribers: number
  closeTimer: number | null
}

type DashboardWsStore = {
  connections: Record<string, ConnectionEntry>
  subscribe: (organizationId: string, listener: MessageListener) => () => void
}

const CLOSE_GRACE_PERIOD_MS = 5_000

function getWsUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return null

  return apiUrl.replace("http://", "ws://").replace("https://", "wss://") + "/ws/dashboard"
}

function createEntry(): ConnectionEntry {
  return {
    connected: false,
    ws: null,
    listeners: new Set(),
    subscribers: 0,
    closeTimer: null,
  }
}

function setConnectionState(
  set: (updater: (state: DashboardWsStore) => Partial<DashboardWsStore>) => void,
  organizationId: string,
  updater: (current: ConnectionEntry) => ConnectionEntry,
) {
  set((state) => {
    const base = state.connections[organizationId] ?? createEntry()
    const next = updater(base)

    return {
      connections: {
        ...state.connections,
        [organizationId]: next,
      },
    }
  })
}

export const useDashboardWsStore = create<DashboardWsStore>((set, get) => ({
  connections: {},
  subscribe: (organizationId, listener) => {
    const wsUrl = getWsUrl()
    if (!wsUrl) {
      return () => undefined
    }

    const existing = get().connections[organizationId] ?? createEntry()
    const listeners = new Set(existing.listeners)

    if (existing.closeTimer !== null) {
      window.clearTimeout(existing.closeTimer)
    }

    listeners.add(listener)

    let ws = existing.ws
    const shouldOpenSocket = !ws || ws.readyState === WebSocket.CLOSED

    if (shouldOpenSocket) {
      ws = new WebSocket(wsUrl)
    }

    const nextEntry: ConnectionEntry = {
      ...existing,
      ws,
      listeners,
      subscribers: existing.subscribers + 1,
      closeTimer: null,
    }

    setConnectionState(set, organizationId, () => nextEntry)

    if (shouldOpenSocket && ws) {
      const ownedSocket = ws

      ownedSocket.onopen = () => {
        const token = getCookie("token")
        ownedSocket.send(
          JSON.stringify({
            type: "AUTH",
            payload: {
              organizationId,
              token: typeof token === "string" ? token : undefined,
            },
          }),
        )

        setConnectionState(set, organizationId, (current) => ({
          ...current,
          connected: true,
        }))
      }

      ownedSocket.onclose = () => {
        setConnectionState(set, organizationId, (current) => {
          if (current.ws !== ownedSocket) {
            return current
          }

          return {
            ...current,
            ws: null,
            connected: false,
          }
        })
      }

      ownedSocket.onmessage = (event: MessageEvent<string>) => {
        try {
          const message = JSON.parse(event.data) as DashboardWsMessage
          const currentListeners = get().connections[organizationId]?.listeners
          if (!currentListeners) return

          for (const listenerFn of currentListeners) {
            listenerFn(message)
          }
        } catch {
          // ignore invalid ws payload
        }
      }
    }

    return () => {
      const current = get().connections[organizationId]
      if (!current) return

      const nextListeners = new Set(current.listeners)
      nextListeners.delete(listener)

      const nextSubscribers = Math.max(0, current.subscribers - 1)
      let closeTimer: number | null = current.closeTimer

      if (nextSubscribers === 0 && current.ws) {
        closeTimer = window.setTimeout(() => {
          const latest = get().connections[organizationId]
          if (!latest || latest.subscribers > 0 || !latest.ws) return

          latest.ws.close()
        }, CLOSE_GRACE_PERIOD_MS)
      }

      setConnectionState(set, organizationId, (entry) => ({
        ...entry,
        listeners: nextListeners,
        subscribers: nextSubscribers,
        closeTimer,
      }))
    }
  },
}))
