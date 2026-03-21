"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  Building2,
  Plus,
} from "lucide-react";

import { OrganizationForm } from "../../org/organization-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OrganizationCard } from "./organization-card";

interface SelectOrganizationViewProps {
  organizations: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
  }[]
}

export function SelectOrganizationView({ organizations }: SelectOrganizationViewProps) {
  const router = useRouter()
  const [isCreateOrganizationOpen, setIsCreateOrganizationOpen] = useState(false)
  const hasOrganizations = organizations.length > 0

  async function handleOrganizationCreated() {
    setIsCreateOrganizationOpen(false)
    router.refresh()
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
              {hasOrganizations
                ? `Você tem acesso a ${organizations.length} organizações.`
                : "Você ainda não tem nenhuma organização. Crie a primeira para começar."}
            </p>
          </div>

          {hasOrganizations ? (
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
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle>Criar organization</CardTitle>
                <CardDescription>
                  Abra o formulário e cadastre a sua primeira organization para continuar.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Dialog
                  open={isCreateOrganizationOpen}
                  onOpenChange={setIsCreateOrganizationOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Plus className="size-4" />
                      Criar organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Criar organization</DialogTitle>
                      <DialogDescription>
                        Preencha os dados abaixo para criar sua primeira organization.
                      </DialogDescription>
                    </DialogHeader>
                    <OrganizationForm onSuccess={handleOrganizationCreated} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
