"use client"

import { Gauge } from "@/components/gauge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, Fan, Power, Snowflake, Thermometer, Wifi, WifiOff } from "lucide-react"
import { useEffect, useState } from "react"
import { InstrumentControls } from "./instrument-controls"


type OperationalStatus = "refrigerating" | "defrosting" | "idle" | "alarm" | "fan-only" | "off"

interface RealtimeData {
  temperature: number
  pressure: number
  humidity: number
  timestamp: string
  connected: boolean
  operationalStatus: OperationalStatus
}

interface RealtimeGaugesProps {
  id: string
  initialSetpoint: number
  initialDifferential: number
  initialDefrost: boolean
  initialFan: boolean
  operationalStatus: OperationalStatus
}

export function RealtimeGauges({
  id,
  initialSetpoint,
  initialDifferential,
  initialDefrost,
  initialFan,
  operationalStatus: initialOperationalStatus,
}: RealtimeGaugesProps) {
  const [data, setData] = useState<RealtimeData>({
    temperature: -18.5,
    pressure: 101.3,
    humidity: 85,
    timestamp: new Date().toISOString(),
    connected: true,
    operationalStatus: initialOperationalStatus,
  })

  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Simular atualizações em tempo real a cada 5 segundos
    const interval = setInterval(() => {
      setIsUpdating(true)

      setTimeout(() => {
        setData((prevData) => {
          // Ocasionalmente mudar o status operacional
          const newOperationalStatus =
            Math.random() > 0.8
              ? (["refrigerating", "defrosting", "idle", "fan-only", "off", "alarm"][
                Math.floor(Math.random() * 6)
              ] as OperationalStatus)
              : prevData.operationalStatus

          return {
            temperature: prevData.temperature + (Math.random() * 1.2 - 0.6),
            pressure: prevData.pressure + (Math.random() * 0.4 - 0.2),
            humidity: prevData.humidity + (Math.random() * 2 - 1),
            timestamp: new Date().toISOString(),
            connected: Math.random() > 0.05, // 95% chance de estar conectado
            operationalStatus: newOperationalStatus,
          }
        })
        setIsUpdating(false)
      }, 500)
    }, 5000)

    return () => clearInterval(interval)
  }, [id])

  const getTemperatureStatus = (temp: number) => {
    if (temp < -22 || temp > -14) return { status: "critical", label: "Crítico", color: "bg-red-500" }
    if (temp < -20 || temp > -16) return { status: "warning", label: "Atenção", color: "bg-yellow-500" }
    return { status: "normal", label: "Normal", color: "bg-green-500" }
  }

  const getOperationalStatusBadge = (status: OperationalStatus) => {
    switch (status) {
      case "refrigerating":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Snowflake className="h-3 w-3" />
            <span>Refrigeração</span>
          </Badge>
        )
      case "defrosting":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
            <Snowflake className="h-3 w-3" />
            <span>Degelo</span>
          </Badge>
        )
      case "fan-only":
        return (
          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center gap-1">
            <Fan className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Ventilação</span>
          </Badge>
        )
      case "idle":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Standby</span>
          </Badge>
        )
      case "alarm":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 animate-pulse"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Alarme</span>
          </Badge>
        )
      case "off":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            <Power className="h-3 w-3" />
            <span>Desligado</span>
          </Badge>
        )
      default:
        return null
    }
  }

  const tempStatus = getTemperatureStatus(data.temperature)

  return (
    <div className="space-y-6">
      {/* Status de Conexão e Operação */}
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
            {getOperationalStatusBadge(data.operationalStatus)}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Última atualização: {new Date(data.timestamp).toLocaleTimeString()}</span>
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
                  Temperatura
                </CardTitle>
                <Badge className={tempStatus.color}>{tempStatus.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Gauge
                value={data.temperature}
                min={-25}
                max={-10}
                status={tempStatus.status as "normal" | "warning" | "critical"}
                size={200}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.pressure.toFixed(1)} kPa</div>
                  <div className="text-sm text-muted-foreground mt-1">Pressão</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.humidity.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mt-1">Umidade</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Controles Operacionais</CardTitle>
            </CardHeader>
            <CardContent>
              <InstrumentControls
                id={id}
                initialSetpoint={initialSetpoint}
                initialDifferential={initialDifferential}
                initialDefrost={initialDefrost}
                initialFan={initialFan}
                operationalStatus={data.operationalStatus}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
