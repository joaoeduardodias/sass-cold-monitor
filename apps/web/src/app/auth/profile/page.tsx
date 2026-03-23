import { getCurrentOrg } from "@/auth/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getProfile } from "@/http/users/get-profile"
import { getInitials } from "@/utils/get-initials"
import { AlertCircle, ArrowLeft, Calendar, Mail, Save, Shield, User } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { updateProfileAction } from "./actions"

const roleLabels: Record<"ADMIN" | "EDITOR" | "OPERATOR" | "VIEWER", string> = {
  ADMIN: "Administrador",
  EDITOR: "Editor",
  OPERATOR: "Operador",
  VIEWER: "Visualizador",
}

type ProfilePageProps = {
  searchParams: Promise<{
    success?: string
    error?: string
  }>
}

async function submitProfile(formData: FormData) {
  "use server"

  const result = await updateProfileAction(formData)

  if (!result.success) {
    const fallbackError = "Não foi possível salvar seu perfil."
    const message = encodeURIComponent(result.message ?? fallbackError)
    redirect(`/auth/profile?error=${message}`)
  }

  redirect("/auth/profile?success=1")
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [params, currentOrg, profileResponse] = await Promise.all([
    searchParams,
    getCurrentOrg(),
    getProfile(),
  ])

  const { user } = profileResponse
  const primaryMembership = user.memberships?.[0]
  const backHref = currentOrg ? `/org/${currentOrg}` : "/select-organization"

  return (
    <div className="w-full self-stretch bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 overflow-hidden rounded-3xl border border-border/60 bg-linear-to-r from-slate-50 via-background to-blue-50/70 shadow-sm">
          <div className="flex flex-col gap-5 px-6 py-6 sm:px-8">
            <div className="flex items-start gap-4">
              <Button variant="outline" size="icon" asChild className="bg-background/80">
                <Link href={backHref}>
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>

              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Conta e preferências
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Meu Perfil</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Atualize suas informações pessoais e acompanhe os dados principais da sua conta no ColdMonitor.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form action={submitProfile}>
          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-6">
              <Card className="overflow-hidden border-border/60">
                <div className="bg-linear-to-br from-blue-600 via-blue-700 to-slate-900 px-6 py-8 text-white">
                  <div className="flex justify-center">
                    <Avatar className="size-24 border-4 border-white/20 shadow-lg">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? "Usuário"} />
                      <AvatarFallback className="bg-white/15 text-2xl text-white backdrop-blur">
                        {getInitials(user.name || "Usuário")}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="mt-5 text-center">
                    <h2 className="text-xl font-semibold">{user.name || "Usuário"}</h2>
                    <p className="mt-1 text-sm text-blue-100">{user.email || "Sem e-mail"}</p>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                      {primaryMembership ? roleLabels[primaryMembership.role] : "Minha Conta"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="space-y-4 px-6 py-5">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Organização atual
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      {primaryMembership?.organization.name ?? "Nenhuma organização selecionada"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Perfil de acesso
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Suas permissões e dados de conta aparecem organizados ao lado para consulta rápida.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="size-4 text-blue-600" />
                    Permissões
                  </CardTitle>
                  <CardDescription>
                    Capacidades disponíveis para o seu usuário nesta conta.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {(user.permissions ?? []).length === 0 ? (
                      <span className="text-muted-foreground">Sem permissões registradas</span>
                    ) : (
                      user.permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                        >
                          <div className="size-2 rounded-full bg-green-500" />
                          <span>{permission}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="size-4 text-blue-600" />
                    Informações da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <Label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Data de Ingresso</Label>
                    <p className="mt-2 text-sm font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <Label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Última Atualização</Label>
                    <p className="mt-2 text-sm font-medium">
                      {user.updatedAt ? new Date(user.updatedAt).toLocaleString("pt-BR") : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <Label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">ID do Usuário</Label>
                    <p className="mt-2 break-all text-sm font-medium">{user.id}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {params.error && (
                <Alert variant="destructive" className="border-destructive/30">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Falha ao salvar perfil</AlertTitle>
                  <AlertDescription>
                    <p>{decodeURIComponent(params.error)}</p>
                  </AlertDescription>
                </Alert>
              )}

              {params.success && (
                <Alert className="border-emerald-200 bg-emerald-50/70 text-emerald-900">
                  <AlertTitle>Perfil atualizado</AlertTitle>
                  <AlertDescription className="text-emerald-800">
                    Suas informações foram salvas com sucesso.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="border-border/60">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="flex items-center gap-2">
                    <User className="size-5 text-blue-600" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>Atualize os dados principais exibidos na sua conta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="profile-name">Nome Completo</Label>
                      <Input id="profile-name" name="name" defaultValue={user.name ?? ""} required minLength={2} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input id="profile-email" name="email" type="email" defaultValue={user.email} required />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="size-5 text-blue-600" />
                    Resumo da Conta
                  </CardTitle>
                  <CardDescription>Uma visão rápida dos dados mais importantes do seu cadastro.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Nome atual</p>
                      <p className="mt-2 text-sm font-medium">{user.name || "Usuário"}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Email principal</p>
                      <p className="mt-2 text-sm font-medium">{user.email}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Função</p>
                      <div className="mt-2">
                        <Badge variant="secondary">
                          {primaryMembership ? roleLabels[primaryMembership.role] : "Minha Conta"}
                        </Badge>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Permissões listadas</p>
                      <p className="mt-2 text-sm font-medium">{user.permissions?.length ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <input type="hidden" name="avatarUrl" value={user.avatarUrl ?? ""} />

              <Separator />

              <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Button variant="outline" asChild>
                  <Link href={backHref}>Cancelar</Link>
                </Button>
                <Button type="submit">
                  <Save className="mr-2 size-4" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
