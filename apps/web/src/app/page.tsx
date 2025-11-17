import { AlertsPanel } from "@/components/alerts-panel";
import { ColdStorageGrid } from "@/components/cold-storage-grid";

export default function Home() {
  return (
    <main className="container mx-auto pt-4 mb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Monitoramento de Câmaras Frias</h2>
        <p className="text-muted-foreground">Monitore os dados em tempo real.</p>
      </div>
      <div className="flex gap-6">
        <div className="flex-1">
          <ColdStorageGrid />
        </div>
        <AlertsPanel />
      </div>
    </main>
  );
}
