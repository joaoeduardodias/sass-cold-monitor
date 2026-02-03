import { AlertsPanel } from "@/components/alerts-panel";
import { Header } from "@/components/header";
import { InstrumentGrid } from "@/components/instrument-grid";

export default function HomeOrg() {
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
            <InstrumentGrid />
          </div>
          <AlertsPanel />
        </div>
      </main>
    </>
  );
}
