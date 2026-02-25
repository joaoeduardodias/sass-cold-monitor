"use client"

import type { DashboardWsMessage, Instrument, InstrumentStatus } from "@/components/instrument-grid.types"
import { getInstrumentsByOrganization } from "@/http/instruments/get-instruments-by-organization"
import { getNotificationSettings } from "@/http/notifications/get-notification-settings"
import { getCookie } from "cookies-next"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

const COMMUNICATION_TIMEOUT_MS = 10_000
const WARNING_THRESHOLD = 0.3
const CRITICAL_THRESHOLD = 0.1

function toNumberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  return value
}

function getStatusByValue(value: number, minValue: number, maxValue: number): InstrumentStatus {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue === maxValue) {
    return "normal"
  }

  const lowerBound = Math.min(minValue, maxValue)
  const upperBound = Math.max(minValue, maxValue)

  if (value <= lowerBound || value >= upperBound) {
    return "critical"
  }

  const range = upperBound - lowerBound
  const distanceToLower = value - lowerBound
  const distanceToUpper = upperBound - value
  const nearestBoundaryDistance = Math.min(distanceToLower, distanceToUpper)
  const boundaryDistanceRatio = nearestBoundaryDistance / range

  if (boundaryDistanceRatio <= CRITICAL_THRESHOLD) {
    return "critical"
  }

  if (boundaryDistanceRatio <= WARNING_THRESHOLD) {
    return "warning"
  }

  return "normal"
}

function mapOperationalStatus(status?: string): Instrument["operationalStatus"] | null {
  if (!status) return null

  const normalized = status.toLowerCase()

  if (normalized.includes("refrig")) return "refrigerating"
  if (normalized.includes("onlin")) return "on-line"
  if (normalized.includes("degel") || normalized.includes("defrost")) return "defrosting"
  if (normalized.includes("fan")) return "fan-only"
  if (normalized.includes("alarm") || normalized.includes("alarme")) return "alarm"
  if (normalized.includes("off") || normalized.includes("deslig")) return "off"
  if (normalized.includes("idle") || normalized.includes("aguard")) return "idle"

  return null
}

type UseInstrumentGridParams = {
  organizationId: string
  organizationSlug: string
}

function createInitialInstrument(organizationId: string, instrument: {
  id: string
  idSitrad: number | null
  name: string
  slug: string
  model: number
  type: "TEMPERATURE" | "PRESSURE"
  minValue: number
  maxValue: number
}): Instrument {
  return {
    id: instrument.id,
    idSitrad: instrument.idSitrad,
    name: instrument.name,
    slug: instrument.slug,
    model: instrument.model,
    type: instrument.type,
    organizationId,
    min: instrument.minValue,
    max: instrument.maxValue,
    value: null,
    status: "normal",
    operationalStatus: "idle",
    error: false,
    isSensorError: false,
    setpoint: null,
    differential: null,
    lastUpdated: null,
  }
}

export function useInstrumentGrid({ organizationId, organizationSlug }: UseInstrumentGridParams) {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [wsConnectedAt, setWsConnectedAt] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const pushEnabledRef = useRef(true)
  const hasShownLoadErrorRef = useRef(false)
  const alertStatusByInstrumentRef = useRef<Map<string, InstrumentStatus>>(new Map())

  const notifyStatusAlert = useCallback((instrument: Instrument) => {
    if (instrument.value === null || instrument.status === "normal") return

    const title = `Alerta ${instrument.status === "critical" ? "Crítico" : "de Atenção"}`
    const body = `${instrument.name}: valor ${instrument.value.toFixed(1)} (mín ${instrument.min.toFixed(1)} / máx ${instrument.max.toFixed(1)})`

    if (pushEnabledRef.current && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, tag: `alert-${instrument.id}` })
    }

    if (instrument.status === "critical") {
      toast.error(body)
      return
    }

    toast.warning(body)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadInstruments = async () => {
      try {
        const { instruments: responseInstruments } = await getInstrumentsByOrganization(organizationSlug)
        if (!isMounted) return

        hasShownLoadErrorRef.current = false
        setInstruments(responseInstruments.map((instrument) => createInitialInstrument(organizationId, instrument)))
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
    return () => {
      isMounted = false
    }
  }, [organizationId, organizationSlug])

  useEffect(() => {
    const nextKnownIds = new Set(instruments.map((instrument) => instrument.id))
    const previousStatuses = alertStatusByInstrumentRef.current

    for (const [instrumentId] of previousStatuses) {
      if (!nextKnownIds.has(instrumentId)) {
        previousStatuses.delete(instrumentId)
      }
    }

    for (const instrument of instruments) {
      const previousStatus = previousStatuses.get(instrument.id) ?? "normal"
      previousStatuses.set(instrument.id, instrument.status)

      if (instrument.error || instrument.isSensorError || instrument.status === "normal") {
        continue
      }

      if (instrument.status !== previousStatus) {
        notifyStatusAlert(instrument)
      }
    }
  }, [instruments, notifyStatusAlert])

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

          if (message.type === "INSTRUMENT_VALUES") {
            setWsConnectedAt(Date.now())
            setInstruments((prev) => {
              const prevById = new Map(prev.map((instrument) => [instrument.id, instrument]))
              const nextById = new Map(prevById)
              const updatedAt = new Date().toISOString()

              for (const reading of message.payload) {
                const previous = prevById.get(reading.instrumentId)
                const nextValue = toNumberOrNull(reading.value)
                const min = previous?.min ?? 0
                const max = previous?.max ?? 0
                const status = nextValue !== null
                  ? getStatusByValue(nextValue, min, max)
                  : previous?.status ?? "normal"

                nextById.set(reading.instrumentId, {
                  id: reading.instrumentId,
                  idSitrad: reading.idSitrad,
                  name: reading.name,
                  slug: reading.slug,
                  model: reading.model,
                  type: reading.type,
                  organizationId: reading.organizationId,
                  min,
                  max,
                  value: nextValue,
                  status,
                  operationalStatus: mapOperationalStatus(reading.status) ?? previous?.operationalStatus ?? "idle",
                  error: reading.error,
                  isSensorError: reading.isSensorError,
                  setpoint: toNumberOrNull(reading.setPoint) ?? previous?.setpoint ?? 0,
                  differential: toNumberOrNull(reading.differential) ?? previous?.differential ?? 0,
                  lastUpdated: updatedAt,
                })
              }

              const ordered = prev.map((instrument) => nextById.get(instrument.id) ?? instrument)
              const existingIds = new Set(prev.map((instrument) => instrument.id))
              const appended = message.payload
                .map((reading) => nextById.get(reading.instrumentId))
                .filter((instrument): instrument is Instrument =>
                  instrument !== undefined && !existingIds.has(instrument.id),
                )

              return [...ordered, ...appended]
            })
            return
          }

          if (message.type === "INSTRUMENT_UPDATE") {
            setWsConnectedAt(Date.now())
            setInstruments((prev) => prev.map((instrument) => {
              if (instrument.id !== message.payload.instrumentId) {
                return instrument
              }

              const nextValue = toNumberOrNull(message.payload.value) ?? instrument.value
              const nextMin = message.payload.minValue
              const nextMax = message.payload.maxValue

              return {
                ...instrument,
                min: nextMin,
                max: nextMax,
                value: nextValue,
                setpoint: toNumberOrNull(message.payload.setpoint) ?? instrument.setpoint,
                differential: toNumberOrNull(message.payload.differential) ?? instrument.differential,
                operationalStatus: mapOperationalStatus(message.payload.status) ?? instrument.operationalStatus,
                status: nextValue !== null ? getStatusByValue(nextValue, nextMin, nextMax) : instrument.status,
                isSensorError: message.payload.isSensorError,
                lastUpdated: message.payload.updatedAt,
              }
            }))
            return
          }

          if (message.type === "ALERT_NOTIFICATION") {
            return
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
