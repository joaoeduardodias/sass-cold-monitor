import Link from "next/link"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInstrumentData } from "@/http/instruments/get-instrument-data"
import { getInstrumentsBySlug } from "@/http/instruments/get-instruments-by-slug"
import { getOrganization } from "@/http/organizations/get-organization"
import { getOperationalStatusBadge, mapOperationalStatus } from "@/utils/get-operational-status-badge"
import {
  ArrowLeft,
  Bell,
  History,
  Thermometer
} from "lucide-react"
import { AlertSettings } from "../components/alert-settings"
import { HistoryTable } from "../components/history-table"
import { RealtimeGauges } from "../components/realtime-gauges"

function toDateMs(input: string | Date) {
  return input instanceof Date ? input.getTime() : new Date(input).getTime()
}

export default async function InstrumentPage({
  params,
}: {
  params: Promise<{ slug: string, instrumentSlug: string }>
}) {
  const { slug, instrumentSlug } = await params

  const [{ organization }, { instrument }] = await Promise.all([
    getOrganization(slug),
    getInstrumentsBySlug({ orgSlug: slug, instrumentSlug }),
  ])

  const { data } = await getInstrumentData({
    orgSlug: slug,
    instrumentSlug,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(),
    chartVariation: 10,
    tableVariation: 10,
  })

  const latestDataPoint = [
    ...data.tableDataTemperature,
    ...data.tableDataPressure,
    ...data.chartDataTemperature,
    ...data.chartDataPressure,
  ].sort((a, b) => toDateMs(b.createdAt) - toDateMs(a.createdAt))[0]

  const currentValue = latestDataPoint?.data ?? null
  const lastUpdated = latestDataPoint ? new Date(latestDataPoint.createdAt).toISOString() : null
  const initialSetpoint = instrument.minValue + (instrument.maxValue - instrument.minValue) / 2
  const initialDifferential = Math.max(0.5, Number(((instrument.maxValue - instrument.minValue) / 6).toFixed(1)))
  const operationalStatus = mapOperationalStatus(
    instrument.operationalStatus ?? (instrument.isActive ? "on-line" : "off"),
  )

  return (
    <>
      <Header />
      <div className="container mx-auto py-6 min-[1200px]:px-4">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/org/${slug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{instrument.name}</h1>
            {getOperationalStatusBadge(operationalStatus)}
          </div>
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
                    id={instrument.id}
                    orgSlug={slug}
                    organizationId={organization.id}
                    model={instrument.model}
                    instrumentType={instrument.type}
                    minValue={instrument.minValue}
                    maxValue={instrument.maxValue}
                    initialValue={currentValue}
                    initialLastUpdated={lastUpdated}
                    initialSetpoint={initialSetpoint}
                    initialDifferential={initialDifferential}
                    initialDefrost={operationalStatus === "defrosting"}
                    initialFan={Boolean(instrument.isFan)}
                    operationalStatus={operationalStatus}
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
                  <HistoryTable
                    instrumentName={instrument.name}
                    id={instrument.id}
                    orgSlug={slug}
                    instrumentSlug={instrumentSlug}
                    minValue={instrument.minValue}
                    maxValue={instrument.maxValue}
                  />
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
                  <AlertSettings id={instrument.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
