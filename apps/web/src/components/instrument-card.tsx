import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import { getOperationalStatusBadge } from '@/utils/get-operational-status-badge'

import { Gauge } from './gauge'
import type { Instrument, InstrumentStatus } from './instrument-grid.types'
import { Badge } from './ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'

function getStatusBadge(status: InstrumentStatus) {
  switch (status) {
    case 'normal':
      return <Badge className="bg-green-500 hover:bg-green-500">Normal</Badge>
    case 'warning':
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-500">Atenção</Badge>
      )
    case 'critical':
      return <Badge className="bg-red-500 hover:bg-red-500">Crítico</Badge>
    default:
      return <Badge>Desconhecido</Badge>
  }
}

type InstrumentCardProps = {
  instrument: Instrument
  communicationFailure: boolean
  orgSlug: string
}

export function InstrumentCard({
  instrument,
  communicationFailure,
  orgSlug,
}: InstrumentCardProps) {
  const isTemperature = instrument.type === 'TEMPERATURE'
  const unit = isTemperature ? '°C' : ' Bar'
  const hasInstrumentError = instrument.error || instrument.isSensorError
  const isFailureState = communicationFailure || hasInstrumentError
  const failureMessage = instrument.isSensorError
    ? 'Erro de Sensor'
    : hasInstrumentError
      ? 'Erro de comunicação'
      : 'Falha de comunicação'

  return (
    <Link
      href={`/org/${orgSlug}/instrument/${instrument.slug}`}
      className="block w-full min-w-0"
    >
      <Card
        className={`h-full w-full min-w-0 gap-2 overflow-hidden border-t py-3 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg ${
          isFailureState ? 'border border-red-300 bg-red-50/50' : 'border-0'
        }`}
      >
        <CardHeader className="px-3">
          <div className="flex w-full min-w-0 flex-col items-start gap-1">
            <div className="flex w-full min-w-0 items-center gap-1">
              <CardTitle
                className="block w-full min-w-0 overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap"
                title={instrument.name}
              >
                {instrument.name}
              </CardTitle>
            </div>
            <div className="flex w-full items-center justify-between gap-1">
              {isFailureState ? (
                <Badge className="bg-red-500 hover:bg-red-500">
                  {failureMessage}
                </Badge>
              ) : (
                getOperationalStatusBadge(instrument.operationalStatus)
              )}
              {instrument.status !== 'normal' && !isFailureState && (
                <div>{getStatusBadge(instrument.status)}</div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-3 pb-1">
          {isFailureState ? (
            <div className="space-y-1 rounded-md border border-red-200 bg-red-100/60 p-2 text-red-700">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <AlertTriangle className="size-3.5" />
                {failureMessage}
              </div>
              {instrument.isSensorError ? (
                <p className="text-xs text-red-600">
                  O sensor reportou erro na leitura.
                </p>
              ) : hasInstrumentError ? (
                <p className="text-xs text-red-600">
                  O instrumento reportou erro de comunicação.
                </p>
              ) : (
                <p className="text-xs text-red-600">
                  O instrumento não recebeu leituras do websocket.
                </p>
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
                  size={80}
                />
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="mt-auto grid w-full grid-cols-4 gap-1 border-t px-3 pt-2 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">Mín</div>
            <div
              className={`font-medium ${isFailureState ? 'text-red-700' : 'text-blue-600'}`}
            >
              {instrument.min}
              {unit}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Setpoint</div>
            <div
              className={`font-medium ${isFailureState ? 'text-red-700' : 'text-green-600'}`}
            >
              {instrument.setpoint !== null
                ? `${instrument.setpoint.toFixed(1)}${unit}`
                : '--'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Dif</div>
            <div
              className={`font-medium ${isFailureState ? 'text-red-700' : 'text-purple-600'}`}
            >
              {instrument.differential !== null
                ? `${instrument.differential.toFixed(1)}${unit}`
                : '--'}
            </div>
          </div>
          <div className="text-center">
            <div
              className={`text-muted-foreground ${isFailureState ? 'text-red-700' : ''}`}
            >
              Máx
            </div>
            <div
              className={`font-medium ${isFailureState ? 'text-red-700' : 'text-red-600'}`}
            >
              {instrument.max}
              {unit}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
