"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowDown, ArrowUp, CheckCheck, ChevronLeft, ChevronRight, Clock, Filter, Gauge, ThermometerSnowflake, TrendingUp, X } from 'lucide-react'
import { useEffect, useState } from "react"
import { Badge } from "./ui/badge"

type Alert = {
  id: number
  storageId: number
  storageName: string
  type: "temperature" | "pressure"
  severity: "warning" | "critical"
  value: number
  threshold: number
  minThreshold?: number
  maxThreshold?: number
  thresholdType: "min" | "max"
  timestamp: string
  read: boolean
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isOpen, setIsOpen] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all")

  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: 1,
        storageId: 2,
        storageName: "Câmara 02",
        type: "temperature",
        severity: "critical",
        value: -15.2,
        threshold: -18,
        minThreshold: -20,
        maxThreshold: -15,
        thresholdType: "max",
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        read: false,
      },
      {
        id: 2,
        storageId: 4,
        storageName: "Câmara 04",
        type: "temperature",
        severity: "warning",
        value: -17.3,
        threshold: -18,
        minThreshold: -20,
        maxThreshold: -15,
        thresholdType: "max",
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        read: false,
      },
      {
        id: 3,
        storageId: 4,
        storageName: "Câmara 04",
        type: "pressure",
        severity: "critical",
        value: 99.7,
        threshold: 100,
        minThreshold: 98,
        maxThreshold: 102,
        thresholdType: "min",
        timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
        read: true,
      },
    ]

    setAlerts(mockAlerts)

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const storageId = Math.floor(Math.random() * 6) + 1
        const isCritical = Math.random() > 0.6
        const isTemp = Math.random() > 0.5
        const exceedsMax = Math.random() > 0.5

        const newAlert: Alert = {
          id: Date.now(),
          storageId,
          storageName: `Câmara 0${storageId}`,
          type: isTemp ? "temperature" : "pressure",
          severity: isCritical ? "critical" : "warning",
          value: isTemp
            ? (exceedsMax ? -10 - Math.random() * 5 : -22 - Math.random() * 3)
            : (exceedsMax ? 103 + Math.random() * 3 : 96 - Math.random() * 2),
          threshold: isTemp ? -18 : 100,
          minThreshold: isTemp ? -20 : 98,
          maxThreshold: isTemp ? -15 : 102,
          thresholdType: exceedsMax ? "max" : "min",
          timestamp: new Date().toISOString(),
          read: false,
        }
        setAlerts((prev) => [newAlert, ...prev].slice(0, 20))
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const markAsRead = (id: number) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, read: true } : alert)))
  }

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })))
  }

  const deleteAlert = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diff < 1) return "Agora"
    if (diff < 60) return `${diff}m atrás`
    return date.toLocaleDateString()
  }

  const visibleAlerts = alerts.filter(alert => {
    const date = new Date(alert.timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000)
    return diff < 4
  })

  const filteredAlerts = visibleAlerts.filter((alert) => {
    if (filter === "unread") return !alert.read
    if (filter === "critical") return alert.severity === "critical"
    return true
  })

  const unreadCount = visibleAlerts.filter((a) => !a.read).length
  const criticalCount = visibleAlerts.filter((a) => a.severity === "critical" && !a.read).length

  const getAlertColors = (alert: Alert) => {
    if (alert.read) {
      return {
        border: "border-border",
        bg: "bg-muted/30",
        hover: "hover:bg-muted/50",
        icon: "text-muted-foreground",
        badge: "bg-muted text-muted-foreground border-border",
      }
    }

    if (alert.severity === "critical") {
      return {
        border: "border-red-200",
        bg: "bg-red-50",
        hover: "hover:bg-red-100",
        icon: "text-red-600",
        badge: "bg-red-100 text-red-700 border-red-200",
      }
    }
    return {
      border: "border-amber-200",
      bg: "bg-amber-50",
      hover: "hover:bg-amber-100",
      icon: "text-amber-600",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
    }
  }

  const getThresholdDescription = (alert: Alert) => {
    const unit = alert.type === "temperature" ? "°C" : "kPa"
    const isAbove = alert.thresholdType === "max"

    if (alert.minThreshold !== undefined && alert.maxThreshold !== undefined) {
      return {
        text: isAbove
          ? `Acima do limite máximo de ${alert.maxThreshold.toFixed(1)}${unit}`
          : `Abaixo do limite mínimo de ${alert.minThreshold.toFixed(1)}${unit}`,
        icon: isAbove ? ArrowUp : ArrowDown,
        range: `Faixa ideal: ${alert.minThreshold.toFixed(1)}${unit} a ${alert.maxThreshold.toFixed(1)}${unit}`,
      }
    }

    return {
      text: isAbove
        ? `Acima do limite de ${alert.threshold.toFixed(1)}${unit}`
        : `Abaixo do limite de ${alert.threshold.toFixed(1)}${unit}`,
      icon: isAbove ? ArrowUp : ArrowDown,
      range: null,
    }
  }

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out",
      isOpen ? "w-96" : "w-16"
    )}>
      {isOpen ? (
        <Card className="h-full shadow-lg border-border/40">
          <CardHeader className="pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <AlertTriangle className={cn(
                    "size-5",
                    criticalCount > 0 ? "text-red-500 animate-pulse" : "text-amber-500"
                  )} />
                  {criticalCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-2 bg-red-500 rounded-full animate-ping" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Alertas</h3>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} não ${unreadCount === 1 ? 'lido' : 'lidos'}` : 'Tudo em dia'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="size-8 p-0 hover:bg-accent"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Filter className="size-3.5" />
                    {filter === "all" ? "Todos" : filter === "unread" ? "Não lidos" : "Críticos"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={() => setFilter("all")}>
                    Todos ({alerts.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("unread")}>
                    Não lidos ({unreadCount})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("critical")}>
                    Críticos ({criticalCount})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-2"
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
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="rounded-full bg-green-100 p-3 mb-4">
                    <CheckCheck className="size-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium mb-1">Nenhum alerta</p>
                  <p className="text-xs text-muted-foreground">
                    {filter === "all"
                      ? "Todas as câmaras estão operando normalmente"
                      : `Nenhum alerta ${filter === "unread" ? "não lido" : "crítico"}`
                    }
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
                          "group relative rounded-lg border p-4 transition-all cursor-pointer",
                          colors.border,
                          colors.bg,
                          colors.hover,
                          !alert.read && "shadow-sm"
                        )}
                        onClick={() => markAsRead(alert.id)}
                      >
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          {alert.severity === "critical" && !alert.read && (
                            <Badge variant="outline" className={cn("text-xs font-medium", colors.badge)}>
                              Crítico
                            </Badge>
                          )}
                          {alert.read && (
                            <Badge variant="outline" className="text-xs font-medium bg-muted/50 text-muted-foreground border-border">
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
                          onClick={(e) => deleteAlert(alert.id, e)}
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
                        >
                          <X className="size-3.5" />
                        </Button>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3 pr-16">
                            <div className={cn(
                              "rounded-lg p-2 mt-0.5",
                              alert.read
                                ? "bg-muted"
                                : alert.severity === "critical" ? "bg-red-100" : "bg-amber-100"
                            )}>
                              {alert.type === "temperature" ? (
                                <ThermometerSnowflake className={cn("size-4", colors.icon)} />
                              ) : (
                                <Gauge className={cn("size-4", colors.icon)} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm mb-0.5">{alert.storageName}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                {formatTime(alert.timestamp)}
                              </div>
                            </div>
                          </div>

                          <div className="pl-12 space-y-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold tabular-nums">
                                {alert.value.toFixed(1)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {alert.type === "temperature" ? "°C" : "kPa"}
                              </span>
                            </div>

                            <div className={cn(
                              "flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1 w-fit",
                              alert.read
                                ? "bg-muted text-muted-foreground"
                                : alert.thresholdType === "max"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                            )}>
                              <ThresholdIcon className="size-3.5" />
                              <span>{thresholdInfo.text}</span>
                            </div>

                            {thresholdInfo.range && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <TrendingUp className="size-3" />
                                <span>{thresholdInfo.range}</span>
                              </div>
                            )}
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
        <div className="h-full flex flex-col items-center pt-4 gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="size-12 p-0 hover:bg-accent relative"
          >
            <ChevronLeft className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </div>
      )
      }
    </div >
  )
}
