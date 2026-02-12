import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getCurrentOrg } from "@/auth/auth"
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
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
        </div>
      </div>

      <form action={submitProfile}>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  <Avatar className="size-24">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? "Usuário"} />
                    <AvatarFallback className="bg-blue-600 text-white text-2xl">
                      {getInitials(user.name || "Usuário")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle>{user.name || "Usuário"}</CardTitle>
                <CardDescription>{user.email || "Sem e-mail"}</CardDescription>
                <Badge className="bg-blue-600 hover:bg-blue-600 w-fit mx-auto">
                  {primaryMembership ? roleLabels[primaryMembership.role] : "Minha Conta"}
                </Badge>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-5 text-blue-600" />
                  Permissões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {(user.permissions ?? []).length === 0 ? (
                    <span className="text-muted-foreground">Sem permissões registradas</span>
                  ) : (
                    user.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-green-500" />
                        <span>{permission}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5 text-blue-600" />
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Data de Ingresso</Label>
                  <p className="text-sm font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Última Atualização</Label>
                  <p className="text-sm font-medium">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleString("pt-BR") : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ID do Usuário</Label>
                  <p className="text-sm font-medium break-all">{user.id}</p>
                </div>
                {primaryMembership && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Organização Atual</Label>
                    <p className="text-sm font-medium">{primaryMembership.organization.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            {params.error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Falha ao salvar perfil</AlertTitle>
                <AlertDescription>
                  <p>{decodeURIComponent(params.error)}</p>
                </AlertDescription>
              </Alert>
            )}

            {params.success && (
              <Alert>
                <AlertTitle>Perfil atualizado</AlertTitle>
                <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5 text-blue-600" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>Atualize suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Nome Completo</Label>
                  <Input id="profile-name" name="name" defaultValue={user.name ?? ""} required minLength={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="size-5 text-blue-600" />
                  Informações de Contato
                </CardTitle>
                <CardDescription>Mantenha suas informações de contato atualizadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input id="profile-email" name="email" type="email" defaultValue={user.email} required />
                </div>
              </CardContent>
            </Card>

            <input type="hidden" name="avatarUrl" value={user.avatarUrl ?? ""} />

            <Separator />

            <div className="flex justify-end gap-2">
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
  )
}
