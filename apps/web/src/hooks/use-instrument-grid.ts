"use client"

import type { DashboardWsMessage, Instrument, InstrumentStatus } from "@/components/instrument-grid.types"
import { getInstrumentsByOrganization } from "@/http/instruments/get-instruments-by-organization"
import { getNotificationSettings } from "@/http/notifications/get-notification-settings"
import { getCookie } from "cookies-next"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

const COMMUNICATION_TIMEOUT_MS = 10_000
const REFRESH_INTERVAL_MS = 5_000

function getStatusByValue(value: number, minValue: number, maxValue: number): InstrumentStatus {
  if (value <= minValue || value >= maxValue) {
    return "critical"
  }

  const range = Math.max(0, maxValue - minValue)
  const warningMargin = range * 0.1

  if (value <= minValue + warningMargin || value >= maxValue - warningMargin) {
    return "warning"
  }

  return "normal"
}

type UseInstrumentGridParams = {
  organizationId: string
  organizationSlug: string
}

export function useInstrumentGrid({ organizationId, organizationSlug }: UseInstrumentGridParams) {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [wsConnectedAt, setWsConnectedAt] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const pushEnabledRef = useRef(true)
  const hasShownLoadErrorRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const loadInstruments = async () => {
      try {
        const { instruments: responseInstruments } = await getInstrumentsByOrganization(organizationSlug)
        if (!isMounted) return

        hasShownLoadErrorRef.current = false

        setInstruments((previousInstruments) => {
          const previousById = new Map(previousInstruments.map((instrument) => [instrument.id, instrument]))

          return responseInstruments.map((instrument) => {
            const previous = previousById.get(instrument.id)

            return {
              id: instrument.id,
              name: instrument.name,
              type: instrument.type,
              temperature: previous?.temperature ?? null,
              pressure: previous?.pressure ?? null,
              setpoint: previous?.setpoint ?? null,
              differential: previous?.differential ?? null,
              min: instrument.minValue,
              max: instrument.maxValue,
              status: previous?.status ?? "normal",
              operationalStatus: previous?.operationalStatus ?? "idle",
              lastUpdated: previous?.lastUpdated ?? null,
            }
          })
        })
      } catch {
        if (!hasShownLoadErrorRef.current) {
          toast.error("Não foi possível carregar os instrumentos.")
          hasShownLoadErrorRef.current = true
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadInstruments()
    const interval = window.setInterval(() => {
      void loadInstruments()
    }, REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [organizationSlug])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let ws: WebSocket | null = null

    const requestBrowserPermission = async () => {
      if (!("Notification" in window)) return
      if (Notification.permission === "default") {
        await Notification.requestPermission()
      }
    }

    const setupNotifications = async () => {
      try {
        const { settings } = await getNotificationSettings(organizationSlug)
        pushEnabledRef.current = settings.pushEnabled
      } catch {
        pushEnabledRef.current = true
      }

      await requestBrowserPermission()

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) return

      const wsUrl = apiUrl.replace("http://", "ws://").replace("https://", "wss://") + "/ws/dashboard"

      ws = new WebSocket(wsUrl)
      ws.onopen = () => {
        setWsConnectedAt(Date.now())

        const token = getCookie("token")
        ws?.send(
          JSON.stringify({
            type: "AUTH",
            payload: {
              organizationId,
              token: typeof token === "string" ? token : undefined,
            },
          }),
        )
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as DashboardWsMessage

          if (message.type === "INSTRUMENT_UPDATE") {
            setInstruments((prev) =>
              prev.map((instrument) => {
                if (instrument.id !== message.payload.instrumentId) {
                  return instrument
                }

                const isTemperature = instrument.type === "TEMPERATURE"
                const nextTemperature =
                  message.payload.temperature ?? (isTemperature ? message.payload.editValue : instrument.temperature)
                const nextPressure =
                  message.payload.pressure ?? (!isTemperature ? message.payload.editValue : instrument.pressure)
                const nextReferenceValue = isTemperature ? nextTemperature : nextPressure

                return {
                  ...instrument,
                  temperature: nextTemperature,
                  pressure: nextPressure,
                  setpoint: message.payload.setpoint ?? instrument.setpoint,
                  differential: message.payload.differential ?? instrument.differential,
                  status:
                    nextReferenceValue !== null
                      ? getStatusByValue(nextReferenceValue, instrument.min, instrument.max)
                      : instrument.status,
                  lastUpdated: message.payload.updatedAt,
                }
              }),
            )
          }

          if (message.type === "ALERT_NOTIFICATION") {
            const title = `Alerta ${message.payload.alertType === "critical" ? "Crítico" : "de Atenção"}`
            const body = `${message.payload.chamberName}: valor ${message.payload.currentValue} (limite ${message.payload.limitValue})`

            if (pushEnabledRef.current && "Notification" in window && Notification.permission === "granted") {
              new Notification(title, { body, tag: `alert-${message.payload.instrumentId}` })
            }

            toast.warning(body)
          }
        } catch {
          // ignore invalid ws payload
        }
      }
    }

    void setupNotifications()

    return () => {
      ws?.close()
    }
  }, [organizationId, organizationSlug])

  const isCommunicationFailure = useCallback(
    (instrument: Instrument) => {
      if (!wsConnectedAt) return false
      const referenceTs = instrument.lastUpdated ? new Date(instrument.lastUpdated).getTime() : wsConnectedAt
      return nowMs - referenceTs > COMMUNICATION_TIMEOUT_MS
    },
    [nowMs, wsConnectedAt],
  )

  const hasCommunicationFailures = useMemo(
    () => instruments.some((instrument) => isCommunicationFailure(instrument)),
    [instruments, isCommunicationFailure],
  )

  return {
    instruments,
    loading,
    hasCommunicationFailures,
    isCommunicationFailure,
  }
}
