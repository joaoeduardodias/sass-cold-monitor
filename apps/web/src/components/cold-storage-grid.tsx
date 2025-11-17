"use client"

import { AlertTriangle, Clock, Fan, Power, GaugeIcon as PressureGauge, Snowflake, Thermometer } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Gauge } from "./gauge"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"

type OperationalStatus = "refrigerating" | "defrosting" | "idle" | "alarm" | "fan-only" | "off"

type ColdStorage = {
  id: number
  name: string
  temperature?: number
  pressure?: number
  min: number
  max: number
  status: "normal" | "warning" | "critical"
  operationalStatus: OperationalStatus
  lastUpdated: string
}

export function ColdStorageGrid() {
  const [storages, setStorages] = useState<ColdStorage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const mockData: ColdStorage[] = [
      {
        id: 1,
        name: "Câmara 01",
        temperature: -18.5,
        status: "normal",
        min: -25,
        max: -10,
        operationalStatus: "refrigerating",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Câmara 02",
        pressure: 100.8,
        status: "warning",
        min: -25,
        max: -10,
        operationalStatus: "defrosting",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Câmara 03",
        temperature: -20.1,
        min: -25,
        max: -10,
        status: "normal",
        operationalStatus: "fan-only",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 4,
        name: "Câmara 04",
        pressure: 99.7,
        min: -25,
        max: -10,
        status: "critical",
        operationalStatus: "alarm",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 5,
        name: "Câmara 05",
        temperature: -19.2,
        status: "normal",
        min: -25,
        max: -10,
        operationalStatus: "idle",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 6,
        name: "Câmara 06",
        temperature: -17.8,
        status: "normal",
        min: -25,
        max: -10,
        operationalStatus: "off",
        lastUpdated: new Date().toISOString(),
      },
    ]

    setStorages(mockData)
    setLoading(false)

    // Atualização simulada a cada 30 segundos
    const interval = setInterval(() => {
      setStorages((prevStorages) =>
        prevStorages.map((storage) => {
          // Gerar um novo status operacional aleatoriamente às vezes
          const newOperationalStatus =
            Math.random() > 0.7
              ? (["refrigerating", "defrosting", "idle", "fan-only", "off", "alarm"][
                Math.floor(Math.random() * 6)
              ] as OperationalStatus)
              : storage.operationalStatus

          return {
            ...storage,
            ...(storage.temperature && {
              temperature: storage.temperature + (Math.random() * 0.6 - 0.3),
            }),
            ...(storage.pressure && {
              pressure: storage.pressure + (Math.random() * 0.2 - 0.1),
            }),
            lastUpdated: new Date().toISOString(),
            status: Math.random() > 0.8 ? (Math.random() > 0.5 ? "warning" : "critical") : "normal",
            operationalStatus: newOperationalStatus,
          }
        }),
      )
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "normal":
  //       return "bg-green-500"
  //     case "warning":
  //       return "bg-yellow-500"
  //     case "critical":
  //       return "bg-red-500"
  //     default:
  //       return "bg-gray-500"
  //   }
  // }

  const getStatusBadge = (status: string) => {
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

  const getOperationalStatusBadge = (status: OperationalStatus) => {
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
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 animate-pulse"
          >
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

  if (loading) {
    return <div className="flex justify-center p-12">Carregando dados...</div>
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 min-w-72">
      {storages.map((storage) => (
        <Link href={`/storage/${storage.id}`} key={storage.id} className="block">
          <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] border-0 shadow-md border-t">
            <CardHeader>
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold">{storage.name}</CardTitle>
                </div>
                <div className="w-full flex items-center justify-between">
                  {getOperationalStatusBadge(storage.operationalStatus)}
                  {storage.status !== "normal" && <div>{getStatusBadge(storage.status)}</div>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="mb-4 space-y-3">
                {storage.temperature && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center ">
                      <Thermometer className="size-5 text-blue-600" />
                      <span className="text-base text-muted-foreground">Temperatura</span>
                    </div>
                    <span className="text-lg font-medium">{storage.temperature.toFixed(1)}°C</span>
                  </div>
                )}



                {storage.pressure && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PressureGauge className="size-5 text-blue-600" />
                      <span className="text-base text-muted-foreground">Pressão</span>
                    </div>
                    <span className="text-lg font-medium">{storage.pressure.toFixed(1)} Bar</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                {storage.temperature && (
                  <Gauge value={storage.temperature} min={-25} max={-10} status={storage.status} size={100} />
                )}
                {storage.pressure && (
                  <Gauge value={storage.pressure} min={-25} max={-10} status={storage.status} size={100} />
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 grid grid-cols-4 gap-2 w-full text-xs">
              <div className="text-center">
                <div className="text-muted-foreground">Mín</div>
                <div className="font-medium text-blue-600">{storage.min}°C</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Setpoint</div>
                <div className="font-medium text-green-600">12 °C</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Dif</div>
                <div className="font-medium text-purple-600">0.5 °C</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Máx</div>
                <div className="font-medium text-red-600">{storage.max}°C</div>
              </div>

            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
