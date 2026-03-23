import Link from "next/link"
import { redirect } from "next/navigation"

import { ability, getCurrentOrg } from '@/auth/auth'
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInstrumentsByOrganization } from "@/http/instruments/get-instruments-by-organization"
import { getOrganization } from '@/http/organizations/get-organization'
import { ArrowLeft, Bell, Building, Download, Settings, Shield, Thermometer, Users } from "lucide-react"

import { OrganizationForm } from '../../organization-form'
import { DownloadCollectorCard } from "../download/download-collector-card"
import { ChamberSettings } from "./components/chamber-settings"
import { NotificationSettings } from "./components/notification-settings"
import { SecuritySettings } from "./components/security-settings"
import { UserManagement } from "./components/user-management"
import { ShutdownOrganizationButton } from './shutdown-organization-button'

const tabValues = ["general", "collector", "instruments", "users", "notifications", "security"] as const

type SettingsPageProps = {
  searchParams?: Promise<{
    tab?: string
  }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const currentOrg = await getCurrentOrg()
  const permissions = await ability(currentOrg ?? undefined)
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const requestedTab = resolvedSearchParams?.tab
  const defaultTab = tabValues.includes(requestedTab as (typeof tabValues)[number]) ? requestedTab : "general"
  const canManageSystem = Boolean(permissions?.can("manage", "all"))

  if (!currentOrg || !canManageSystem) {
    redirect(currentOrg ? `/org/${currentOrg}` : "/select-organization")
  }

  const canUpdateOrganization = permissions?.can('update', 'Organization')
  const canShutdownOrganization = permissions?.can('delete', 'Organization')

  const { organization } = await getOrganization(currentOrg!)
  const { instruments } = await getInstrumentsByOrganization(currentOrg!)

  return (
    <>
      <Header />
      <div className="container mx-auto py-6 min-[1200px]:px-4">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/org/${currentOrg}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">Gerencie as configurações globais do ColdMonitor</p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 transition-all duration-300 ease-in-out px-2">
            <TabsTrigger value="general" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Settings className="size-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="collector" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Download className="size-4" />
              <span className="hidden sm:inline">Coletor</span>
            </TabsTrigger>
            <TabsTrigger value="instruments" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Thermometer className="size-4" />
              <span className="hidden sm:inline">Instrumentos</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Users className="size-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Bell className="size-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>

            <TabsTrigger value="security" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Shield className="size-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>

          </TabsList>

          <TabsContent value="general" className="animate-in fade-in-50 duration-400 space-y-4">
            {canUpdateOrganization && (
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>Configurações básicas do sistema e empresa</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="size-5 text-blue-600" />
                    <h3 className="text-lg font-medium">Informações da Empresa</h3>
                  </div>
                  <OrganizationForm
                    isUpdating
                    initialData={{
                      name: organization.name,
                      domain: organization.domain,
                      shouldAttachUsersByDomain:
                        organization.shouldAttachUsersByDomain,
                    }}
                  />
                </CardContent>
              </Card>
            )}


            {canShutdownOrganization && (
              <Card>
                <CardHeader>
                  <CardTitle>Encerrar organização</CardTitle>
                  <CardDescription>
                    Isso irá excluir todos os dados da organização, incluindo todos os instrumentos.
                    Você não pode desfazer essa ação.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShutdownOrganizationButton />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collector" className="animate-in fade-in-50 duration-400 space-y-4">
            <DownloadCollectorCard organizationId={organization.id} />

            <Card>
              <CardHeader>
                <CardTitle>Como ativar a API do Sitrad PRO</CardTitle>
                <CardDescription>
                  Siga este passo a passo para concluir a integracao do coletor com o servidor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Acesse o Sitrad PRO e abra as configuracoes do servidor.</li>
                  <li>No menu do servidor, entre na secao de API.</li>
                  <li>Informe e ative a licenca da API.</li>
                  <li>Crie um usuario e senha para acesso da API.</li>
                  <li>Crie um grupo para a API e conceda permissoes de leitura e escrita.</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instruments" className="animate-in fade-in-50 duration-400">
            <Card>
              <CardHeader>
                <CardTitle>Configuração das Câmaras</CardTitle>
                <CardDescription>Gerencie todas as câmaras frias em um só local</CardDescription>
              </CardHeader>
              <CardContent>
                <ChamberSettings initialInstruments={instruments} organizationSlug={currentOrg!} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="animate-in fade-in-50 duration-400" >
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>Gerencie usuários, permissões e grupos de acesso</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement organizationSlug={currentOrg ?? undefined} />
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="notifications" className="animate-in fade-in-50 duration-400" >
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificações</CardTitle>
                <CardDescription>Configure alertas globais e métodos de notificação</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSettings organizationSlug={currentOrg ?? undefined} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security" className="animate-in fade-in-50 duration-400" >
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>Configure autenticação, logs e políticas de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                <SecuritySettings organizationSlug={currentOrg ?? undefined} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
