import { getOrganizations } from "@/http/organizations/get-organizations"
import { Building2 } from "lucide-react"
import { OrganizationCard } from "./components/organization-card"

export default async function SelectOrganizationPage() {
  const { organizations } = await getOrganizations()

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-2">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold">
              Selecione uma organização
            </h1>

            <p className="text-muted-foreground max-w-md mx-auto">
              Você tem acesso a {organizations.length} organizações.
            </p>
          </div>


          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <OrganizationCard
                key={org.id}
                avatarUrl={org.avatarUrl}
                name={org.name}
                slug={org.slug}
                id={org.id}
              />
            ))}
          </div>


        </div>
      </main>
    </div>
  )
}
