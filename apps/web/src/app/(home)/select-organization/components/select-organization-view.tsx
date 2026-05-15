'use client'

import { Building2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { OrganizationForm } from '../../org/organization-form'
import { OrganizationCard } from './organization-card'

interface SelectOrganizationViewProps {
  organizations: {
    id: string
    name: string
    slug: string
    avatarUrl: string | null
  }[]
}

export function SelectOrganizationView({
  organizations,
}: SelectOrganizationViewProps) {
  const router = useRouter()
  const [isCreateOrganizationOpen, setIsCreateOrganizationOpen] =
    useState(false)
  const hasOrganizations = organizations.length > 0

  async function handleOrganizationCreated() {
    setIsCreateOrganizationOpen(false)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-3 text-center">
            <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Selecione uma empresa
            </h1>

            <p className="text-muted-foreground mx-auto max-w-md">
              {hasOrganizations
                ? `Você tem acesso a ${organizations.length} empresas.`
                : 'Você ainda não tem nenhuma empresa. Crie a primeira para começar.'}
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
            <Card className="mx-auto max-w-2xl">
              <CardHeader className="text-center">
                <CardTitle>Adicionar Empresa</CardTitle>
                <CardDescription>
                  Abra o formulário e adicione a sua primeira empresa para
                  continuar.
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
                      Adicionar Empresa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Criar Empresa</DialogTitle>
                      <DialogDescription>
                        Preencha os dados abaixo para criar sua primeira
                        empresa.
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
