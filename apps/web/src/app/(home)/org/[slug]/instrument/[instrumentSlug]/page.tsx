import Link from "next/link"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getInstrumentData } from "@/http/instruments/get-instrument-data"
import { getInstrumentsBySlug } from "@/http/instruments/get-instruments-by-slug"
import { getOrganization } from "@/http/organizations/get-organization"
import { getOperationalStatusBadge, mapOperationalStatus } from "@/utils/get-operational-status-badge"
import {
  ArrowLeft,
} from "lucide-react"
import { HistoryTable } from "../components/history-table"
import { InstrumentPageTabs } from "../components/instrument-page-tabs"
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
  const initialNowIso = new Date().toISOString()

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
          <InstrumentPageTabs
            realtime={(
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
            )}
            history={(
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Leituras</CardTitle>
                </CardHeader>
                <CardContent>
                  <HistoryTable
                    initialNowIso={initialNowIso}
                    instrumentName={instrument.name}
                    id={instrument.id}
                    orgSlug={slug}
                    instrumentSlug={instrumentSlug}
                    instrumentType={instrument.type}
                    minValue={instrument.minValue}
                    maxValue={instrument.maxValue}
                  />
                </CardContent>
              </Card>
            )}
          />
        </div>
      </div>
    </>
  )
}
