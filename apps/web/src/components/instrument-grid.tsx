"use client"

import { useInstrumentGrid } from "@/hooks/use-instrument-grid"
import { InstrumentCard } from "./instrument-card"

type InstrumentGridProps = {
  organizationId: string
  organizationSlug: string
}

export function InstrumentGrid({ organizationId, organizationSlug }: InstrumentGridProps) {
  const { instruments, loading, hasCommunicationFailures, isCommunicationFailure } = useInstrumentGrid({
    organizationId,
    organizationSlug,
  })


  if (loading) {
    return <div className="flex justify-center p-12">Carregando dados...</div>
  }

  return (
    <div className="space-y-4">
      {hasCommunicationFailures && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Falha de comunicação com o websocket. Alguns instrumentos estão sem leitura em tempo real.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 min-w-72">
        {instruments.map((instrument) => (
          <InstrumentCard
            key={instrument.id}
            instrument={instrument}
            communicationFailure={isCommunicationFailure(instrument)}
          />
        ))}
      </div>
    </div>
  )
}
