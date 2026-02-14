import { AlertTriangle, Clock, Fan, Power, GaugeIcon as PressureGauge, Snowflake, Thermometer } from "lucide-react"
import Link from "next/link"
import { Gauge } from "./gauge"
import type { Instrument, InstrumentStatus, OperationalStatus } from "./instrument-grid.types"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"

function getStatusBadge(status: InstrumentStatus) {
  switch (status) {
    case "normal":
      return <Badge className="bg-green-500 hover:bg-green-500">Normal</Badge>
    case "warning":
      return <Badge className="bg-yellow-500 hover:bg-yellow-500">Atenção</Badge>
    case "critical":
      return <Badge className="bg-red-500 hover:bg-red-500">Crítico</Badge>
    default:
      return <Badge>Desconhecido</Badge>
  }
}

function getOperationalStatusBadge(status: OperationalStatus) {
  switch (status) {
    case "refrigerating":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
          <Snowflake className="size-3" />
          <span>Refrigeração</span>
        </Badge>
      )
    case "defrosting":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
          <Snowflake className="size-3" />
          <span>Degelo</span>
        </Badge>
      )
    case "fan-only":
      return (
        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center gap-1">
          <Fan className="size-3 animate-spin" style={{ animationDuration: "3s" }} />
          <span>Ventilação</span>
        </Badge>
      )
    case "idle":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
          <Clock className="size-3" />
          <span>Standby</span>
        </Badge>
      )
    case "alarm":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 animate-pulse">
          <AlertTriangle className="size-3" />
          <span>Alarme</span>
        </Badge>
      )
    case "off":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
          <Power className="size-3" />
          <span>Desligado</span>
        </Badge>
      )
    default:
      return null
  }
}

type InstrumentCardProps = {
  instrument: Instrument
  communicationFailure: boolean
}

export function InstrumentCard({ instrument, communicationFailure }: InstrumentCardProps) {
  const isTemperature = instrument.type === "TEMPERATURE"
  const unit = isTemperature ? "°C" : " Bar"
  const mainValue = isTemperature ? instrument.temperature : instrument.pressure
  return (
    <Link href={`/instrument/${instrument.id}`} className="block">
      <Card
        className={`h-full transition-all hover:shadow-lg hover:scale-[1.02] shadow-md border-t ${communicationFailure ? "border border-red-300 bg-red-50/50" : "border-0"
          }`}
      >
        <CardHeader>
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 w-full">
              <CardTitle className="text-lg font-semibold truncate w-full" title={instrument.name}>
                {instrument.name}
              </CardTitle>
            </div>
            <div className="w-full flex items-center justify-between gap-2">
              {communicationFailure ? (
                <Badge className="bg-red-500 hover:bg-red-500">Falha de comunicação</Badge>
              ) : (
                getOperationalStatusBadge(instrument.operationalStatus)
              )}
              {instrument.status !== "normal" && !communicationFailure && <div>{getStatusBadge(instrument.status)}</div>}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {communicationFailure ? (
            <div className="rounded-md border border-red-200 bg-red-100/60 p-3 text-red-700 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="size-4" />
                Sem dados em tempo real
              </div>
              <p className="text-xs text-red-600">O instrumento não recebeu leituras do websocket.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-3">
                {isTemperature && instrument.temperature !== null && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Thermometer className="size-5 text-blue-600" />
                      <span className="text-base text-muted-foreground">Temperatura</span>
                    </div>
                    <span className="text-lg font-medium">{instrument.temperature.toFixed(1)}°C</span>
                  </div>
                )}

                {!isTemperature && instrument.pressure !== null && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PressureGauge className="size-5 text-blue-600" />
                      <span className="text-base text-muted-foreground">Pressão</span>
                    </div>
                    <span className="text-lg font-medium">{instrument.pressure.toFixed(1)} Bar</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                {mainValue !== null && (
                  <Gauge value={mainValue} min={instrument.min} max={instrument.max} status={instrument.status} size={100} />
                )}
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="border-t pt-4 grid grid-cols-4 gap-2 w-full text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">Mín</div>
            <div className={`font-medium ${communicationFailure ? "text-red-700" : "text-blue-600"}`}>
              {instrument.min}
              {unit}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Setpoint</div>
            <div className={`font-medium ${communicationFailure ? "text-red-700" : "text-green-600"}`}>
              {instrument.setpoint !== null ? `${instrument.setpoint.toFixed(1)}${unit}` : "--"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Dif</div>
            <div className={`font-medium ${communicationFailure ? "text-red-700" : "text-purple-600"}`}>
              {instrument.differential !== null ? `${instrument.differential.toFixed(1)}${unit}` : "--"}
            </div>
          </div>
          <div className="text-center">
            <div className={`text-muted-foreground ${communicationFailure ? "text-red-700" : ""}`}>Máx</div>
            <div className={`font-medium ${communicationFailure ? "text-red-700" : "text-red-600"}`}>
              {instrument.max}
              {unit}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
