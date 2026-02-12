import { AlertsPanel } from "@/components/alerts-panel";
import { Header } from "@/components/header";
import { InstrumentGrid } from "@/components/instrument-grid";
import { getOrganization } from "@/http/organizations/get-organization";

export default async function HomeOrg({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { organization } = await getOrganization(slug)

  return (
    <>
      <Header />
      <main className="container mx-auto pt-4 mb-8 min-[1200px]:px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Monitoramento de Câmaras Frias</h2>
          <p className="text-muted-foreground">Monitore os dados em tempo real.</p>
        </div>
        <div className="flex gap-6">
          <div className="flex-1">
            <InstrumentGrid organizationId={organization.id} organizationSlug={slug} />
          </div>
          <AlertsPanel />
        </div>
      </main>
    </>
  );
}
