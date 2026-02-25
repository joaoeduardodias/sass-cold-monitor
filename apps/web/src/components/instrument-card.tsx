import { AlertTriangle, Clock, Fan, Power, Snowflake } from "lucide-react"
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
          <Snowflake className="size-3 animate-spin" style={{ animationDuration: "2s" }} />
          <span>Refrigeração</span>
        </Badge>
      )
    case "on-line":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <Power className="size-3" />
          <span>Em Operação</span>
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
  const hasInstrumentError = instrument.error || instrument.isSensorError
  const isFailureState = communicationFailure || hasInstrumentError
  const failureMessage = instrument.isSensorError
    ? "Erro de Sensor"
    : hasInstrumentError
      ? "Erro de comunicação"
      : "Falha de comunicação"



  return (
    <Link href={`/instrument/${instrument.id}`} className="block">
      <Card
        className={`h-full transition-all hover:shadow-lg hover:scale-[1.02] shadow-md border-t ${isFailureState ? "border border-red-300 bg-red-50/50" : "border-0"
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
              {isFailureState ? (
                <Badge className="bg-red-500 hover:bg-red-500">{failureMessage}</Badge>
              ) : (
                getOperationalStatusBadge(instrument.operationalStatus)
              )}
              {instrument.status !== "normal" && !isFailureState && <div>{getStatusBadge(instrument.status)}</div>}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {isFailureState ? (
            <div className="rounded-md border border-red-200 bg-red-100/60 p-3 text-red-700 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="size-4" />
                {failureMessage}
              </div>
              {instrument.isSensorError ? (
                <p className="text-xs text-red-600">O sensor reportou erro na leitura.</p>
              ) : hasInstrumentError ? (
                <p className="text-xs text-red-600">O instrumento reportou erro de comunicação.</p>
              ) : (
                <p className="text-xs text-red-600">O instrumento não recebeu leituras do websocket.</p>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              {instrument.value !== null && (
                <Gauge
                  value={instrument.value}
                  type={instrument.type}
                  min={instrument.min}
                  max={instrument.max}
                  status={instrument.status}
                  size={100} />
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-4 grid grid-cols-4 gap-2 w-full text-xs mt-auto">
          <div className="text-center">
            <div className="text-muted-foreground">Mín</div>
            <div className={`font-medium ${isFailureState ? "text-red-700" : "text-blue-600"}`}>
              {instrument.min}
              {unit}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Setpoint</div>
            <div className={`font-medium ${isFailureState ? "text-red-700" : "text-green-600"}`}>
              {instrument.setpoint !== null ? `${instrument.setpoint.toFixed(1)}${unit}` : "--"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Dif</div>
            <div className={`font-medium ${isFailureState ? "text-red-700" : "text-purple-600"}`}>
              {instrument.differential !== null ? `${instrument.differential.toFixed(1)}${unit}` : "--"}
            </div>
          </div>
          <div className="text-center">
            <div className={`text-muted-foreground ${isFailureState ? "text-red-700" : ""}`}>Máx</div>
            <div className={`font-medium ${isFailureState ? "text-red-700" : "text-red-600"}`}>
              {instrument.max}
              {unit}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
