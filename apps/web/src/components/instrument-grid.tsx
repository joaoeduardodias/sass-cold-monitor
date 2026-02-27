"use client"

import type { Instrument } from "@/components/instrument-grid.types"
import { useInstrumentGrid } from "@/hooks/use-instrument-grid"
import { InstrumentCard } from "./instrument-card"

type InstrumentGridProps = {
  organizationId: string
  organizationSlug: string
}

type InstrumentGridContentProps = {
  instruments: Instrument[]
  loading: boolean
  hasCommunicationFailures: boolean
  orgSlug: string
  isCommunicationFailure: (instrument: Instrument) => boolean
}

export function InstrumentGridContent({
  instruments,
  loading,
  hasCommunicationFailures,
  isCommunicationFailure,
  orgSlug,
}: InstrumentGridContentProps) {
  if (loading) {
    return <div className="flex justify-center p-12">Carregando dados...</div>
  }

  return (
    <div className="space-y-4">
      {hasCommunicationFailures && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Falha de comunicação com o Coletor. Os instrumentos estão sem leitura em tempo real.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 min-w-72">
        {instruments.map((instrument) => (
          <InstrumentCard
            key={instrument.id}
            instrument={instrument}
            communicationFailure={isCommunicationFailure(instrument)}
            orgSlug={orgSlug}
          />
        ))}
      </div>
    </div>
  )
}

export function InstrumentGrid({ organizationId, organizationSlug }: InstrumentGridProps) {
  const { instruments, loading, hasCommunicationFailures, isCommunicationFailure } = useInstrumentGrid({
    organizationId,
    organizationSlug,
  })

  return (
    <InstrumentGridContent
      instruments={instruments}
      loading={loading}
      hasCommunicationFailures={hasCommunicationFailures}
      isCommunicationFailure={isCommunicationFailure}
      orgSlug={organizationSlug}
    />
  )
}
