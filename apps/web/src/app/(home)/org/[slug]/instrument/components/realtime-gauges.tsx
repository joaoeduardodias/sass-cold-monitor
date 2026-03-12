"use client"

import { Gauge } from "@/components/gauge"
import type { DashboardWsMessage, OperationalStatus } from "@/components/instrument-grid.types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardWs } from "@/hooks/use-dashboard-ws"
import { sendInstrumentCommand } from "@/http/instruments/send-instrument-command"
import { getOperationalStatusBadge, mapOperationalStatus } from "@/utils/get-operational-status-badge"
import { Clock, Thermometer, Wifi, WifiOff } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { InstrumentControls } from "./instrument-controls"

const COMMUNICATION_TIMEOUT_MS = 10_000

type RealtimeData = {
  temperature: number | null
  pressure: number | null
  humidity: number | null
  timestamp: string
  connected: boolean
  operationalStatus: OperationalStatus
  setpoint: number
  differential: number
  defrost: boolean
  fan: boolean
}

interface RealtimeGaugesProps {
  id: string
  orgSlug: string
  organizationId: string
  model: number
  instrumentType: "TEMPERATURE" | "PRESSURE"
  minValue: number
  maxValue: number
  initialValue: number | null
  initialLastUpdated: string | null
  initialSetpoint: number
  initialDifferential: number
  initialDefrost: boolean
  initialFan: boolean
  operationalStatus: OperationalStatus
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  return value
}

export function RealtimeGauges({
  id,
  orgSlug,
  organizationId,
  model,
  instrumentType,
  minValue,
  maxValue,
  initialValue,
  initialLastUpdated,
  initialSetpoint,
  initialDifferential,
  initialDefrost,
  initialFan,
  operationalStatus: initialOperationalStatus,
}: RealtimeGaugesProps) {
  const [data, setData] = useState<RealtimeData>({
    temperature: instrumentType === "TEMPERATURE" ? initialValue : null,
    pressure: instrumentType === "PRESSURE" ? initialValue : null,
    humidity: null,
    timestamp: initialLastUpdated ?? new Date().toISOString(),
    connected: false,
    operationalStatus: initialOperationalStatus,
    setpoint: initialSetpoint,
    differential: initialDifferential,
    defrost: initialDefrost,
    fan: initialFan,
  })
  const disconnectTimerRef = useRef<number | null>(null)
  const updatePulseTimerRef = useRef<number | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const canControlFan = model !== 73 && instrumentType !== "PRESSURE"

  useEffect(() => {
    return () => {
      if (disconnectTimerRef.current !== null) {
        window.clearTimeout(disconnectTimerRef.current)
      }
      if (updatePulseTimerRef.current !== null) {
        window.clearTimeout(updatePulseTimerRef.current)
      }
    }
  }, [])

  const markReadingAlive = useCallback(() => {
    setData((prev) => (prev.connected ? prev : { ...prev, connected: true }))

    if (disconnectTimerRef.current !== null) {
      window.clearTimeout(disconnectTimerRef.current)
    }

    disconnectTimerRef.current = window.setTimeout(() => {
      setData((prev) => ({ ...prev, connected: false }))
    }, COMMUNICATION_TIMEOUT_MS)
  }, [])

  const handleDashboardMessage = useCallback((message: DashboardWsMessage) => {
    if (message.type === "INSTRUMENT_VALUES") {
      const reading = message.payload.find((item) => item.instrumentId === id)
      if (!reading) return

      const nextValue = toNumberOrNull(reading.value)
      const mappedStatus = mapOperationalStatus(reading.status)

      setIsUpdating(true)
      markReadingAlive()
      setData((prev) => ({
        ...prev,
        temperature: instrumentType === "TEMPERATURE" ? nextValue : prev.temperature,
        pressure: instrumentType === "PRESSURE" ? nextValue : prev.pressure,
        timestamp: new Date().toISOString(),
        setpoint: reading.setPoint,
        differential: reading.differential,
        operationalStatus: mappedStatus,
        defrost: mappedStatus === "defrosting",
        fan: reading.isFan,
      }))
      if (updatePulseTimerRef.current !== null) {
        window.clearTimeout(updatePulseTimerRef.current)
      }
      updatePulseTimerRef.current = window.setTimeout(() => setIsUpdating(false), 250)
      return
    }

    if (message.type === "INSTRUMENT_UPDATE" && message.payload.instrumentId === id) {
      const nextValue = toNumberOrNull(message.payload.value)
      const mappedStatus = mapOperationalStatus(message.payload.status)

      setIsUpdating(true)
      markReadingAlive()
      setData((prev) => ({
        ...prev,
        temperature: instrumentType === "TEMPERATURE" ? nextValue : prev.temperature,
        pressure: instrumentType === "PRESSURE" ? nextValue : prev.pressure,
        timestamp: message.payload.updatedAt ?? new Date().toISOString(),
        setpoint: message.payload.setpoint,
        differential: message.payload.differential,
        operationalStatus: mappedStatus,
        defrost: mappedStatus === "defrosting",
        fan: message.payload.isFan,
      }))
      if (updatePulseTimerRef.current !== null) {
        window.clearTimeout(updatePulseTimerRef.current)
      }
      updatePulseTimerRef.current = window.setTimeout(() => setIsUpdating(false), 250)
      return
    }

  }, [id, instrumentType, markReadingAlive])

  const { connected } = useDashboardWs({
    organizationId,
    onMessage: handleDashboardMessage,
  })

  useEffect(() => {
    if (!connected) {
      setData((prev) => (prev.connected ? { ...prev, connected: false } : prev))
    }
  }, [connected])

  const sendCommand = useCallback(
    async (
      action: "SET_DEFROST" | "SET_FAN" | "SET_SETPOINT" | "SET_DIFFERENTIAL",
      value: boolean | number,
    ) => {
      if (action === "SET_DEFROST" || action === "SET_FAN") {
        await sendInstrumentCommand({
          orgSlug,
          instrumentId: id,
          action,
          value: Boolean(value),
        })
        return
      }

      await sendInstrumentCommand({
        orgSlug,
        instrumentId: id,
        action,
        value: Number(value),
      })
    },
    [id, orgSlug],
  )

  const handleToggleDefrost = useCallback(
    async (checked: boolean) => {
      setData((prev) => ({ ...prev, defrost: checked }))
      await sendCommand("SET_DEFROST", checked)
    },
    [sendCommand],
  )

  const handleToggleFan = useCallback(
    async (checked: boolean) => {
      if (!canControlFan) return
      setData((prev) => ({ ...prev, fan: checked }))
      await sendCommand("SET_FAN", checked)
    },
    [canControlFan, sendCommand],
  )

  const handleSaveSettings = useCallback(
    async (settings: { setpoint: number; differential: number }) => {
      setData((prev) => ({
        ...prev,
        setpoint: settings.setpoint,
        differential: settings.differential,
      }))

      await sendCommand("SET_SETPOINT", settings.setpoint)
      await sendCommand("SET_DIFFERENTIAL", settings.differential)
    },
    [sendCommand],
  )

  const primaryValue = instrumentType === "TEMPERATURE" ? data.temperature : data.pressure
  const primaryUnit = instrumentType === "TEMPERATURE" ? "°C" : "kPa"
  const hasLiveReading = data.connected && primaryValue !== null
  const displayedOperationalStatus = data.connected ? data.operationalStatus : "alarm"

  const tempStatus = useMemo(() => {
    if (!data.connected) {
      return { status: "critical", label: "Erro de comunicação", color: "bg-red-500" as const }
    }
    if (primaryValue === null) {
      return { status: "normal", label: "Sem leitura", color: "bg-gray-500" as const }
    }
    if (primaryValue < minValue || primaryValue > maxValue) {
      return { status: "critical", label: "Crítico", color: "bg-red-500" as const }
    }

    const range = Math.abs(maxValue - minValue)
    const margin = range * 0.2
    if (primaryValue <= minValue + margin || primaryValue >= maxValue - margin) {
      return { status: "warning", label: "Atenção", color: "bg-yellow-500" as const }
    }

    return { status: "normal", label: "Normal", color: "bg-green-500" as const }
  }, [data.connected, maxValue, minValue, primaryValue])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {data.connected ? (
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600">Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-600">Desconectado</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {getOperationalStatusBadge(displayedOperationalStatus)}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span suppressHydrationWarning>
            Última atualização: {new Date(data.timestamp).toLocaleTimeString()}
          </span>
          {isUpdating && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className={`transition-all duration-300 ${isUpdating ? "ring-2 ring-blue-200" : ""}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Thermometer className="h-5 w-5 text-blue-600" />
                  {instrumentType === "TEMPERATURE" ? "Temperatura" : "Pressão"}
                </CardTitle>
                <Badge className={tempStatus.color}>{tempStatus.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex justify-center">
              {hasLiveReading ? (
                <Gauge
                  value={primaryValue}
                  min={minValue}
                  max={maxValue}
                  status={tempStatus.status as "normal" | "warning" | "critical"}
                  size={200}
                  type={instrumentType}
                />
              ) : (
                <div className="flex h-[200px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/70 px-6 text-center">
                  <WifiOff className="h-10 w-10 text-red-500" />
                  <div className="space-y-1">
                    <p className="font-medium text-red-700">
                      {data.connected ? "Sem leitura em tempo real" : "Instrumento desconectado"}
                    </p>
                    <p className="text-sm text-red-600">
                      {data.connected
                        ? `Nenhum valor de ${primaryUnit} disponivel no momento.`
                        : "Status em erro por perda de comunicacao. A ultima temperatura nao sera exibida."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


        </div>

        <div>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Controles Operacionais</CardTitle>
            </CardHeader>
            <CardContent>
              <InstrumentControls
                id={id}
                minValue={minValue}
                maxValue={maxValue}
                setpoint={data.setpoint}
                differential={data.differential}
                defrost={data.defrost}
                fan={data.fan}
                showFanControl={canControlFan}
                onToggleDefrost={handleToggleDefrost}
                onToggleFan={handleToggleFan}
                onSaveSettings={handleSaveSettings}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
