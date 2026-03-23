import { ability } from "@/auth/auth"
import { Header } from "@/components/header"
import { OrganizationMonitoring } from "@/components/organization-monitoring"
import { getInstrumentsByOrganization } from "@/http/instruments/get-instruments-by-organization"
import { getOrganization } from "@/http/organizations/get-organization"

export default async function HomeOrg({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { organization } = await getOrganization(slug)
  const { instruments } = await getInstrumentsByOrganization(slug)
  const permissions = await ability(slug)
  const hasInstruments = instruments.length > 0
  const canManageOrganization = Boolean(permissions?.can("manage", "all"))

  return (
    <>
      <Header />
      <main className="container mx-auto pt-4 mb-8 min-[1200px]:px-4">
        {hasInstruments && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Monitoramento de Câmaras Frias</h1>
            <p className="text-muted-foreground">
              Acompanhe as leituras em tempo real da organização {organization.name}.
            </p>
          </div>
        )}

        <OrganizationMonitoring
          organizationId={organization.id}
          organizationSlug={slug}
          canManageOrganization={canManageOrganization}
        />
      </main>
    </>
  )
}
