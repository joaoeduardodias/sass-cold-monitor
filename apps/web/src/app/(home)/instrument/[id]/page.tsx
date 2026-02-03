import Link from "next/link"

import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Clock,
  Fan,
  History,
  Power,
  Snowflake,
  Thermometer
} from "lucide-react"
import { AlertSettings } from "../components/alert-settings"
import { HistoryTable } from "../components/history-table"
import { RealtimeGauges } from "../components/realtime-gauges"


type OperationalStatus = "refrigerating" | "defrosting" | "idle" | "alarm" | "fan-only" | "off"

export default async function InstrumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const instrument = {
    id,
    name: `Câmara 0${id}`,
    temperature: -18.5,
    pressure: 101.3,
    humidity: 85,
    lastUpdated: new Date().toISOString(),
    minTemp: -22,
    maxTemp: -16,
    minPressure: 100,
    maxPressure: 102,
    setpoint: -18,
    differential: 2,
    defrost: true, // Alternando entre ligado/desligado
    fan: true, // Ventilador ligado por padrão
    operationalStatus: ["refrigerating", "defrosting", "idle", "alarm", "fan-only", "off"][3] as OperationalStatus,
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

  return (
    <>
      <Header />
      <div className="container mx-auto py-6 min-[1200px]:px-4">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{instrument.name}</h1>
            {getOperationalStatusBadge(instrument.operationalStatus)}
          </div>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-6 w-6 text-blue-600" />
                Temperatura
              </CardTitle>
              <CardDescription>Monitoramento principal da câmara fria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Temperatura Atual</span>
                </div>
                <span className="text-4xl font-bold">{instrument.temperature.toFixed(1)}°C</span>
              </div>

              <div className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Setpoint:</span>
                  <div className="text-lg font-semibold text-foreground">{instrument.setpoint}°C</div>
                </div>
                <div>
                  <span className="font-medium">Faixa Operacional:</span>
                  <div className="text-lg font-semibold text-foreground">
                    {instrument.minTemp}°C a {instrument.maxTemp}°C
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="mt-6">
          <Tabs defaultValue="realtime">
            <TabsList>
              <TabsTrigger value="realtime" className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Tempo Real
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alertas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="realtime" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monitoramento e Controle em Tempo Real</CardTitle>
                  <CardDescription>Visualização dos sensores e controles operacionais</CardDescription>
                </CardHeader>
                <CardContent>
                  <RealtimeGauges
                    id={id}
                    initialSetpoint={instrument.setpoint}
                    initialDifferential={instrument.differential}
                    initialDefrost={instrument.defrost}
                    initialFan={instrument.fan}
                    operationalStatus={instrument.operationalStatus}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Leituras</CardTitle>
                  <CardDescription>Últimas 100 leituras</CardDescription>
                </CardHeader>
                <CardContent>
                  <HistoryTable instrumentName={instrument.name} id={id} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="alerts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de Alertas</CardTitle>
                  <CardDescription>Defina os limites para notificações</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertSettings id={id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
