"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useInstrumentGrid } from "@/hooks/use-instrument-grid"
import { ArrowRight, Download, MonitorDown, ShieldCheck, ThermometerSnowflake } from "lucide-react"
import Link from "next/link"
import { AlertsPanel } from "./alerts-panel"
import { InstrumentGridContent } from "./instrument-grid"

type OrganizationMonitoringProps = {
  organizationId: string
  organizationSlug: string
  canManageOrganization?: boolean
}

function EmptyMonitoringState({
  organizationSlug,
  canManageOrganization = false,
}: Pick<OrganizationMonitoringProps, "organizationSlug" | "canManageOrganization">) {
  return (
    <Card className="relative overflow-hidden border-border/70 bg-linear-to-br from-sky-50 via-background to-cyan-50 py-0 shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.16),transparent_35%)]" />

      <CardContent className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm backdrop-blur">
              <MonitorDown className="size-3.5" />
              Ambiente pronto para receber leituras
            </div>

            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Nenhum instrumento conectado ainda
            </h3>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Para começar o monitoramento em tempo real, instale o app coletor em um computador da unidade e
              conecte seus instrumentos. Assim que o coletor iniciar o envio, eles aparecerão aqui automaticamente.
            </p>

            {canManageOrganization ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="shadow-sm">
                  <Link href={`/org/${organizationSlug}/settings?tab=collector`}>
                    <Download className="size-4" />
                    Baixar app coletor
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline" className="bg-white/80">
                  <Link href={`/org/${organizationSlug}/settings?tab=collector`}>
                    Ver instrucoes de instalacao
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="mt-6 text-sm font-medium text-sky-800">
                Aguarde a configuracao do coletor por um administrador para visualizar as leituras aqui.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-foreground">Como ativar o monitoramento</p>

            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 rounded-full  bg-sky-100  text-sky-700 size-9 flex items-center justify-center">
                  <Download className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">1. Baixe o coletor</p>
                  <p className="text-sm text-muted-foreground">
                    Instale o aplicativo no Windows da unidade que vai ler os equipamentos.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-3 rounded-full bg-cyan-100 text-cyan-700 size-9 flex items-center justify-center">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">2. Gere o token de ativacao</p>
                  <p className="text-sm text-muted-foreground">
                    Na aba de configuracao do coletor voce gera as credenciais para o primeiro acesso.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 rounded-full bg-emerald-100 text-emerald-700 size-9 flex items-center justify-center">
                  <ThermometerSnowflake className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">3. Conecte os instrumentos</p>
                  <p className="text-sm text-muted-foreground">
                    Depois da configuracao inicial, os dados comecam a chegar aqui em tempo real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrganizationMonitoring({
  organizationId,
  organizationSlug,
  canManageOrganization = false,
}: OrganizationMonitoringProps) {
  const { instruments, loading, hasCommunicationFailures, isCommunicationFailure } = useInstrumentGrid({
    organizationId,
    organizationSlug,
  })

  if (!loading && instruments.length === 0) {
    return (
      <EmptyMonitoringState
        organizationSlug={organizationSlug}
        canManageOrganization={canManageOrganization}
      />
    )
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <InstrumentGridContent
          instruments={instruments}
          loading={loading}
          hasCommunicationFailures={hasCommunicationFailures}
          isCommunicationFailure={isCommunicationFailure}
          orgSlug={organizationSlug}
        />
      </div>
      <AlertsPanel organizationSlug={organizationSlug} instruments={instruments} loading={loading} />
    </div>
  )
}
