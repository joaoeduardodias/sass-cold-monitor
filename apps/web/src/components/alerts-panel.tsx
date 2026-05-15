'use client'

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Gauge,
  ThermometerSnowflake,
  TrendingUp,
  X,
} from 'lucide-react'
import { type MouseEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type {
  Instrument,
  InstrumentStatus,
} from '@/components/instrument-grid.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getAlertReadSignatures } from '@/http/alerts/get-alert-read-signatures'
import { markAlertAsRead } from '@/http/alerts/mark-alert-as-read'
import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'

type AlertsPanelProps = {
  organizationSlug: string
  instruments: Instrument[]
  loading: boolean
}

type AlertFilter = 'all' | 'unread' | 'critical'
type AlertSeverity = Exclude<InstrumentStatus, 'normal'>

type InstrumentAlert = {
  id: string
  instrumentId: string
  instrumentName: string
  type: Instrument['type']
  severity: AlertSeverity
  value: number
  minThreshold: number
  maxThreshold: number
  thresholdType: 'min' | 'max'
  timestamp: string
  signature: string
  read: boolean
}

function toAlertSeverity(status: InstrumentStatus): AlertSeverity | null {
  if (status === 'warning' || status === 'critical') {
    return status
  }

  return null
}

function getThresholdTypeByValue(
  value: number,
  min: number,
  max: number,
): 'min' | 'max' {
  if (value <= min) return 'min'
  if (value >= max) return 'max'

  const distanceToMin = Math.abs(value - min)
  const distanceToMax = Math.abs(max - value)

  return distanceToMin <= distanceToMax ? 'min' : 'max'
}

function buildAlertSignature(params: {
  severity: AlertSeverity
  thresholdType: 'min' | 'max'
  minThreshold: number
  maxThreshold: number
}): string {
  const { severity, thresholdType, minThreshold, maxThreshold } = params
  return `${severity}:${thresholdType}:${minThreshold.toFixed(3)}:${maxThreshold.toFixed(3)}`
}

export function AlertsPanel({
  organizationSlug,
  instruments,
  loading,
}: AlertsPanelProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [filter, setFilter] = useState<AlertFilter>('all')
  const [isPersisting, setIsPersisting] = useState(false)
  const [readSignatureByInstrument, setReadSignatureByInstrument] = useState<
    Record<string, string>
  >({})

  useEffect(() => {
    let cancelled = false

    const loadReadSignatures = async () => {
      try {
        const { readSignatures } =
          await getAlertReadSignatures(organizationSlug)
        if (cancelled) return

        setReadSignatureByInstrument(
          Object.fromEntries(
            readSignatures.map((entry) => [
              entry.instrumentId,
              entry.signature,
            ]),
          ),
        )
      } catch {
        if (!cancelled) {
          toast.error('Não foi possível carregar os alertas lidos.')
        }
      }
    }

    loadReadSignatures()

    return () => {
      cancelled = true
    }
  }, [organizationSlug])

  useEffect(() => {
    const activeIds = new Set(instruments.map((instrument) => instrument.id))

    setReadSignatureByInstrument((prev) => {
      const nextEntries = Object.entries(prev).filter(([instrumentId]) =>
        activeIds.has(instrumentId),
      )
      return Object.fromEntries(nextEntries)
    })
  }, [instruments])

  const alerts = useMemo<InstrumentAlert[]>(() => {
    return instruments
      .filter((instrument) => instrument.value !== null)
      .filter((instrument) => !instrument.error && !instrument.isSensorError)
      .map((instrument) => {
        const value = instrument.value as number
        const severity = toAlertSeverity(instrument.status)

        if (!severity) return null

        const thresholdType = getThresholdTypeByValue(
          value,
          instrument.min,
          instrument.max,
        )
        const signature = buildAlertSignature({
          severity,
          thresholdType,
          minThreshold: instrument.min,
          maxThreshold: instrument.max,
        })

        return {
          id: `${instrument.id}:${signature}`,
          instrumentId: instrument.id,
          instrumentName: instrument.name,
          type: instrument.type,
          severity,
          value,
          minThreshold: instrument.min,
          maxThreshold: instrument.max,
          thresholdType,
          timestamp: instrument.lastUpdated ?? new Date().toISOString(),
          signature,
          read: readSignatureByInstrument[instrument.id] === signature,
        }
      })
      .filter((alert): alert is InstrumentAlert => alert !== null)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
  }, [instruments, readSignatureByInstrument])

  const persistReadAlert = async (alert: InstrumentAlert) => {
    await markAlertAsRead({
      org: organizationSlug,
      instrumentId: alert.instrumentId,
      signature: alert.signature,
      severity: alert.severity,
      value: alert.value,
      minThreshold: alert.minThreshold,
      maxThreshold: alert.maxThreshold,
      thresholdType: alert.thresholdType,
      alertTimestamp: alert.timestamp,
    })

    setReadSignatureByInstrument((prev) => ({
      ...prev,
      [alert.instrumentId]: alert.signature,
    }))
  }

  const markAsRead = async (alert: InstrumentAlert) => {
    if (alert.read || isPersisting) return

    setIsPersisting(true)
    try {
      await persistReadAlert(alert)
    } catch {
      toast.error('Não foi possível marcar o alerta como lido.')
    } finally {
      setIsPersisting(false)
    }
  }

  const markAllAsRead = async () => {
    const unreadAlerts = alerts.filter((alert) => !alert.read)
    if (unreadAlerts.length === 0 || isPersisting) return

    setIsPersisting(true)
    try {
      await Promise.all(unreadAlerts.map((alert) => persistReadAlert(alert)))
    } catch {
      toast.error('Não foi possível marcar todos os alertas como lidos.')
    } finally {
      setIsPersisting(false)
    }
  }

  const dismissAlert = async (alert: InstrumentAlert, e?: MouseEvent) => {
    e?.stopPropagation()
    await markAsRead(alert)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diff < 1) return 'Agora'
    if (diff < 60) return `${diff}m atrás`
    return date.toLocaleDateString('pt-BR')
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'unread') return !alert.read
    if (filter === 'critical') return alert.severity === 'critical'
    return true
  })

  const unreadCount = alerts.filter((a) => !a.read).length
  const criticalCount = alerts.filter(
    (a) => a.severity === 'critical' && !a.read,
  ).length

  const getAlertColors = (alert: InstrumentAlert) => {
    if (alert.read) {
      return {
        border: 'border-border',
        bg: 'bg-muted/30',
        hover: 'hover:bg-muted/50',
        icon: 'text-muted-foreground',
        badge: 'bg-muted text-muted-foreground border-border',
      }
    }

    if (alert.severity === 'critical') {
      return {
        border: 'border-red-200',
        bg: 'bg-red-50',
        hover: 'hover:bg-red-100',
        icon: 'text-red-600',
        badge: 'bg-red-100 text-red-700 border-red-200',
      }
    }

    return {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      hover: 'hover:bg-amber-100',
      icon: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
    }
  }

  const getThresholdDescription = (alert: InstrumentAlert) => {
    const unit = alert.type === 'TEMPERATURE' ? '°C' : 'kPa'
    const isAbove = alert.thresholdType === 'max'

    return {
      text: isAbove
        ? `Próximo/Acima do limite máximo de ${alert.maxThreshold.toFixed(1)}${unit}`
        : `Próximo/Abaixo do limite mínimo de ${alert.minThreshold.toFixed(1)}${unit}`,
      icon: isAbove ? ArrowUp : ArrowDown,
      range: `Faixa: ${alert.minThreshold.toFixed(1)}${unit} a ${alert.maxThreshold.toFixed(1)}${unit}`,
    }
  }

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        isOpen ? 'w-96' : 'w-16',
      )}
    >
      {isOpen ? (
        <Card className="border-border/40 h-full shadow-lg">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <AlertTriangle
                    className={cn(
                      'size-5',
                      criticalCount > 0
                        ? 'animate-pulse text-red-500'
                        : 'text-amber-500',
                    )}
                  />
                  {criticalCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-2 animate-ping rounded-full bg-red-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Alertas</h3>
                  <p className="text-muted-foreground text-xs">
                    {loading
                      ? 'Carregando alertas...'
                      : unreadCount > 0
                        ? `${unreadCount} não ${unreadCount === 1 ? 'lido' : 'lidos'}`
                        : 'Tudo em dia'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="hover:bg-accent size-8 p-0"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Filter className="size-3.5" />
                    {filter === 'all'
                      ? 'Todos'
                      : filter === 'unread'
                        ? 'Não lidos'
                        : 'Críticos'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={() => setFilter('all')}>
                    Todos ({alerts.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('unread')}>
                    Não lidos ({unreadCount})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('critical')}>
                    Críticos ({criticalCount})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    markAllAsRead()
                  }}
                  className="gap-2"
                  disabled={isPersisting}
                >
                  <CheckCheck className="size-3.5" />
                  Marcar todos
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-4 rounded-full bg-green-100 p-3">
                    <CheckCheck className="size-6 text-green-600" />
                  </div>
                  <p className="mb-1 text-sm font-medium">Nenhum alerta</p>
                  <p className="text-muted-foreground text-xs">
                    {filter === 'all'
                      ? 'Todos os instrumentos estão operando normalmente'
                      : `Nenhum alerta ${filter === 'unread' ? 'não lido' : 'crítico'}`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 px-4 pb-4">
                  {filteredAlerts.map((alert) => {
                    const colors = getAlertColors(alert)
                    const thresholdInfo = getThresholdDescription(alert)
                    const ThresholdIcon = thresholdInfo.icon

                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          'group relative cursor-pointer rounded-lg border p-4 transition-all',
                          colors.border,
                          colors.bg,
                          colors.hover,
                          !alert.read && 'shadow-sm',
                        )}
                        onClick={() => {
                          markAsRead(alert)
                        }}
                      >
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          {alert.severity === 'critical' && !alert.read && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs font-medium',
                                colors.badge,
                              )}
                            >
                              Crítico
                            </Badge>
                          )}
                          {alert.read && (
                            <Badge
                              variant="outline"
                              className="bg-muted/50 text-muted-foreground border-border text-xs font-medium"
                            >
                              Lido
                            </Badge>
                          )}
                          {!alert.read && (
                            <div className="size-2 rounded-full bg-blue-500" />
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            dismissAlert(alert, e)
                          }}
                          className="hover:bg-background/80 absolute top-1 right-1 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="size-3.5" />
                        </Button>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3 pr-16">
                            <div
                              className={cn(
                                'mt-0.5 rounded-lg p-2',
                                alert.read
                                  ? 'bg-muted'
                                  : alert.severity === 'critical'
                                    ? 'bg-red-100'
                                    : 'bg-amber-100',
                              )}
                            >
                              {alert.type === 'TEMPERATURE' ? (
                                <ThermometerSnowflake
                                  className={cn('size-4', colors.icon)}
                                />
                              ) : (
                                <Gauge className={cn('size-4', colors.icon)} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="mb-0.5 truncate text-sm font-semibold"
                                title={alert.instrumentName}
                              >
                                {alert.instrumentName}
                              </p>
                              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                <Clock className="size-3" />
                                {formatTime(alert.timestamp)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 pl-12">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold tabular-nums">
                                {alert.value.toFixed(1)}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                {alert.type === 'TEMPERATURE' ? '°C' : 'kPa'}
                              </span>
                            </div>

                            <div
                              className={cn(
                                'flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
                                alert.read
                                  ? 'bg-muted text-muted-foreground'
                                  : alert.thresholdType === 'max'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700',
                              )}
                            >
                              <ThresholdIcon className="size-3.5" />
                              <span>{thresholdInfo.text}</span>
                            </div>

                            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                              <TrendingUp className="size-3" />
                              <span>{thresholdInfo.range}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div className="flex h-full flex-col items-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="hover:bg-accent relative size-12 p-0"
          >
            <ChevronLeft className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
