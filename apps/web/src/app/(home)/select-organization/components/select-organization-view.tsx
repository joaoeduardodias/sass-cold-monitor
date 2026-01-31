"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"

import { Input } from "@/components/ui/input"

import {
  Building2,
  Search
} from "lucide-react"

import { toast } from "sonner"
import { OrganizationCard } from "./organization-card"


export interface Organization {
  id: string
  name: string
  logo?: string
  role: "admin" | "operator" | "viewer"
  plan: "free" | "starter" | "professional" | "enterprise"
  chambersCount: number
  alertsCount: number
  status: "online" | "offline" | "warning"
  lastAccess?: string
  isFavorite?: boolean
}


const mockOrganizations: Organization[] = [
  {
    id: "1",
    name: "Frigorífico São Paulo",
    role: "admin",
    plan: "enterprise",
    chambersCount: 24,
    alertsCount: 2,
    status: "warning",
    lastAccess: "Há 2 horas",
    isFavorite: true,
  },
]

const currentUser = {
  name: "João Silva",
  email: "joao.silva@email.com",
  avatar: "",
}


export function SelectOrganizationView() {
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [organizations, setOrganizations] =
    useState<Organization[]>(mockOrganizations)

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectOrganization = async (
    organization: Organization,
  ) => {
    setLoading(organization.id)

    await new Promise((resolve) => setTimeout(resolve, 800))

    toast.success(`Acessando ${organization.name}`)

    setTimeout(() => router.push("/"), 300)
  }

  const toggleFavorite = (
    e: React.MouseEvent,
    organizationId: string,
  ) => {
    e.stopPropagation()

    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === organizationId
          ? { ...o, isFavorite: !o.isFavorite }
          : o,
      ),
    )

    toast.success("Favoritos atualizados")
  }



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

          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                type="search"
                placeholder="Buscar organização..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="pl-10 h-11"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrganizations.map((org: Organization) => (
              <OrganizationCard
                key={org.id}
                organization={org}
                loading={loading === org.id}
                onSelect={() =>
                  handleSelectOrganization(org)
                }
                onToggleFavorite={(e: React.MouseEvent) =>
                  toggleFavorite(e, org.id)
                }
              />
            ))}
          </div>


        </div>
      </main>
    </div>
  )
}
