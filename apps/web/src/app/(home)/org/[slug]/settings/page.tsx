import Link from "next/link"

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
import { ArrowLeft, Bell, Building, Database, Palette, Settings, Shield, Thermometer, Users } from "lucide-react"

import { ChamberSettings } from "@/app/(home)/settings/components/chamber-settings"
import { UserManagement } from "@/app/(home)/settings/components/user-management"
import { OrganizationForm } from '../../organization-form'
import { ShutdownOrganizationButton } from './shutdown-organization-button'

export default async function SettingsPage() {
  const currentOrg = await getCurrentOrg()
  const permissions = await ability()

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
            <Link href="/">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">Gerencie as configurações globais do ColdMonitor</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 transition-all duration-300 ease-in-out">
            <TabsTrigger value="general" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Settings className="size-4" />
              <span className="hidden sm:inline">Geral</span>
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
            <TabsTrigger value="database" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Database className="size-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Shield className="size-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="cursor-pointer flex items-center gap-2 transition-all duration-200 ease-in-out data-[state=active]:scale-105">
              <Palette className="size-4" />
              <span className="hidden sm:inline">Aparência</span>
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
        </Tabs>
      </div>
    </>
  )
}
