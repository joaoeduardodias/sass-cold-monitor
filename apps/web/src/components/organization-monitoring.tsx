"use client"

import { useInstrumentGrid } from "@/hooks/use-instrument-grid"
import { AlertsPanel } from "./alerts-panel"
import { InstrumentGridContent } from "./instrument-grid"

type OrganizationMonitoringProps = {
  organizationId: string
  organizationSlug: string
}

export function OrganizationMonitoring({
  organizationId,
  organizationSlug,
}: OrganizationMonitoringProps) {
  const { instruments, loading, hasCommunicationFailures, isCommunicationFailure } = useInstrumentGrid({
    organizationId,
    organizationSlug,
  })

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
