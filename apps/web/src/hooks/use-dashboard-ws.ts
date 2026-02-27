"use client"

import type { DashboardWsMessage } from "@/components/instrument-grid.types"
import { useDashboardWsStore } from "@/stores/dashboard-ws-store"
import { useEffect, useRef } from "react"

type UseDashboardWsParams = {
  organizationId: string
  onMessage: (message: DashboardWsMessage) => void
}

export function useDashboardWs({ organizationId, onMessage }: UseDashboardWsParams) {
  const subscribe = useDashboardWsStore((state) => state.subscribe)
  const connected = useDashboardWsStore((state) => state.connections[organizationId]?.connected ?? false)
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    const unsubscribe = subscribe(organizationId, (message) => {
      onMessageRef.current(message)
    })

    return () => {
      unsubscribe()
    }
  }, [organizationId, subscribe])

  return {
    connected,
  }
}
