"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Role } from "@cold-monitor/auth"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Clock, Edit, Mail, Plus, RefreshCw, Search, Send, Shield, Trash2, UserCheck, UserPlus, UserX, X } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { getMembers } from "@/http/members/get-members"
import { createInvite } from "@/http/invites/create-invite"
import { getInvites } from "@/http/invites/get-invites"
import { revokeInvite } from "@/http/invites/revoke-invite"
import { removeMember } from "@/http/members/remove-member"
import { toggleStatusMember } from "@/http/members/toggle-status-member"

type Member = {
  id: string
  userId: string
  role: Role
  name: string | null
  isActive: boolean
  email: string
  avatarUrl: string | null
}

type User = {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
}

type UserManagementProps = {
  organizationSlug?: string
}

type Invite = {
  id: string
  email: string
  role: Role
  status: "pending"
  sentAt: string
  expiresAt: string
  sentBy: string
  message?: string
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  operator: "Operador",
  viewer: "Visualizador",
  editor: "Editor",
}

const roleColors: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border-red-200",
  operator: "bg-blue-50 text-blue-700 border-blue-200",
  viewer: "bg-zinc-100 text-zinc-700 border-zinc-200",
  editor: "bg-purple-50 text-purple-700 border-purple-200",
}

export function UserManagement({ organizationSlug }: UserManagementProps) {
  const queryClient = useQueryClient()
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
  const [togglingMemberId, setTogglingMemberId] = useState<string | null>(null)
  const { data: membersData, isLoading, error } = useQuery({
    queryKey: ["members", organizationSlug],
    queryFn: async () => {
      if (!organizationSlug) return []
      const { members } = await getMembers(organizationSlug)
      return members
    },
    enabled: Boolean(organizationSlug),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const users = useMemo<User[]>(
    () =>
      (membersData || []).map((member: Member) => ({
        id: member.id,
        name: member.name ?? "Sem nome",
        email: member.email,
        role: member.role,
        isActive: member.isActive,
        createdAt: "—",
      })),
    [membersData],
  )

  const [newUser, setNewUser] = useState<{
    name: string
    email: string
    role: "admin" | "operator" | "viewer"
  }>({
    name: "",
    email: "",
    role: "viewer",
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchUser, setSearchUser] = useState("")
  const [searchInvite, setSearchInvite] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const [inviteForm, setInviteForm] = useState({
    emails: "",
    role: "viewer" as "admin" | "operator" | "viewer",
    message: "",
  })

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Preencha todos os campos")
      return
    }

    toast.info("A criação de usuários reais ainda não está habilitada.")
    setNewUser({ name: "", email: "", role: "viewer" })
    setIsDialogOpen(false)
  }

  const { mutateAsync: removeMemberMutation } = useMutation({
    mutationFn: async (memberId: string) => {
      if (!organizationSlug) {
        throw new Error("Slug da organização não informado")
      }
      await removeMember({ org: organizationSlug, memberId })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["members", organizationSlug] })
      toast.success("Usuário removido!")
    },
    onError: () => {
      toast.error("Não foi possível remover o usuário.")
    },
  })

  const deleteUser = async (id: string) => {
    try {
      setDeletingMemberId(id)
      await removeMemberMutation(id)
    } finally {
      setDeletingMemberId(null)
    }
  }

  const { mutateAsync: toggleMemberStatusMutation } = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: "active" | "inactive" }) => {
      if (!organizationSlug) {
        throw new Error("Slug da organização não informado")
      }
      await toggleStatusMember({ org: organizationSlug, memberId, status })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["members", organizationSlug] })
      toast.success("Status do usuário alterado!")
    },
    onError: () => {
      toast.error("Não foi possível alterar o status do usuário.")
    },
  })

  const toggleUserStatus = async (id: string, status: "active" | "inactive") => {
    try {
      setTogglingMemberId(id)
      await toggleMemberStatusMutation({ memberId: id, status })
    } finally {
      setTogglingMemberId(null)
    }
  }

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-red-500 hover:bg-red-500">Administrador</Badge>
      case "OPERATOR":
        return <Badge className="bg-blue-500 hover:bg-blue-500">Operador</Badge>
      case "VIEWER":
        return <Badge className="bg-gray-500 hover:bg-gray-500">Visualizador</Badge>
      case "EDITOR":
        return <Badge className="bg-purple-500 hover:bg-purple-500">Editor</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500 hover:bg-green-500">Ativo</Badge>
    ) : (
      <Badge className="bg-gray-500 hover:bg-gray-500">Inativo</Badge>
    )
  }

  const { data: invitesData, isLoading: isInvitesLoading, error: invitesError } = useQuery({
    queryKey: ["invites", organizationSlug],
    queryFn: async () => {
      if (!organizationSlug) return []
      const { invites } = await getInvites(organizationSlug)
      return invites
    },
    enabled: Boolean(organizationSlug),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const roleToApi = (role: "admin" | "operator" | "viewer") => role.toUpperCase() as Role
  const roleToLabelKey = (role: Role) => role.toLowerCase() as keyof typeof roleLabels

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()),
  )

  const invites = useMemo<Invite[]>(() => {
    if (!invitesData) return []
    return invitesData.map((invite) => {
      const createdAt = new Date(invite.createdAt)
      const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
      return {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: "pending",
        sentAt: createdAt.toLocaleString("pt-BR"),
        expiresAt: expiresAt.toLocaleString("pt-BR"),
        sentBy: invite.author?.name ?? "Sistema",
      }
    })
  }, [invitesData])

  const filteredInvites = invites.filter((i) => i.email.toLowerCase().includes(searchInvite.toLowerCase()))
  const pendingInvites = filteredInvites.filter((i) => i.status === "pending")

  const handleSendInvites = async () => {
    const emails = inviteForm.emails
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes("@"))

    if (emails.length === 0) {
      toast.error("Insira pelo menos um email válido")
      return
    }

    if (!organizationSlug) {
      toast.error("Slug da organização não informado")
      return
    }

    const results = await Promise.allSettled(
      emails.map((email) =>
        createInvite({
          org: organizationSlug,
          email,
          role: roleToApi(inviteForm.role),
        }),
      ),
    )

    const successCount = results.filter((result) => result.status === "fulfilled").length
    const errorCount = results.length - successCount

    setInviteForm({ emails: "", role: "viewer", message: "" })
    setIsInviteOpen(false)

    if (successCount > 0) {
      await queryClient.invalidateQueries({ queryKey: ["invites", organizationSlug] })
      toast.success(`${successCount} convite(s) enviado(s)`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} convite(s) não puderam ser enviados`)
    }
  }

  const resendInvite = async (invite: Invite) => {
    if (!organizationSlug) {
      toast.error("Slug da organização não informado")
      return
    }

    try {
      await revokeInvite({ org: organizationSlug, inviteId: invite.id })
      await createInvite({
        org: organizationSlug,
        email: invite.email,
        role: invite.role,
      })
      await queryClient.invalidateQueries({ queryKey: ["invites", organizationSlug] })
      toast.success("Convite reenviado")
    } catch {
      toast.error("Não foi possível reenviar o convite")
    }
  }

  const revokeInviteAction = async (inviteId: string) => {
    if (!organizationSlug) {
      toast.error("Slug da organização não informado")
      return
    }
    try {
      await revokeInvite({ org: organizationSlug, inviteId })
      await queryClient.invalidateQueries({ queryKey: ["invites", organizationSlug] })
      toast.success("Convite revogado")
    } catch {
      toast.error("Não foi possível revogar o convite")
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const parts = expiresAt.split(/[/,\s:]+/)
    const expiry = new Date(
      Number.parseInt(parts[2]),
      Number.parseInt(parts[1]) - 1,
      Number.parseInt(parts[0]),
      Number.parseInt(parts[3] || "0"),
      Number.parseInt(parts[4] || "0"),
    )
    const diff = expiry.getTime() - now.getTime()
    if (diff <= 0) return null
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const hasData = users.length > 0
  const canFetch = Boolean(organizationSlug)
  const hasError = Boolean(error)

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs defaultValue="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="users" className="gap-2">
                Usuários
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {filteredUsers.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="invites" className="gap-2">
                <Mail className="h-4 w-4" />
                Convites
                {pendingInvites.length > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-amber-500 hover:bg-amber-500 text-white">
                    {pendingInvites.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="space-y-4 mt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                    <DialogDescription>Preencha as informações do novo usuário</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-name">Nome Completo</Label>
                      <Input
                        id="user-name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Digite o nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-email">Email</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="Digite o email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-role">Função</Label>
                      <Select value={newUser.role} onValueChange={(value: "viewer" | "operator" | "admin") => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Visualizador</SelectItem>
                          <SelectItem value="operator">Operador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddUser}>Adicionar Usuário</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {canFetch && isLoading && !hasData && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        Carregando usuários...
                      </TableCell>
                    </TableRow>
                  )}
                  {canFetch && hasError && !hasData && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        Não foi possível carregar os usuários.
                      </TableCell>
                    </TableRow>
                  )}
                  {canFetch && !isLoading && !hasData && !hasError && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredUsers.map((user) => {
                    const nextStatus = user.isActive ? "inactive" : "active"
                    const isToggling = togglingMemberId === user.id
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={isToggling}>
                                      {user.isActive ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {user.isActive ? "Inativar usuário" : "Ativar usuário"}
                                  </TooltipContent>
                                </Tooltip>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {user.isActive ? "Inativar usuário" : "Ativar usuário"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja {user.isActive ? "inativar" : "ativar"} este usuário?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => toggleUserStatus(user.id, nextStatus)}>
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar usuário</TooltipContent>
                            </Tooltip>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={deletingMemberId === user.id}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remover usuário</TooltipContent>
                                </Tooltip>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover usuário</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover este usuário da organização?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUser(user.id)}>
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="size-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Níveis de Permissão</h4>
                  <div className="mt-2 space-y-1 text-sm text-blue-800">
                    <p>
                      <strong>Administrador:</strong> Acesso completo ao sistema, incluindo configurações
                    </p>
                    <p>
                      <strong>Operador:</strong> Pode visualizar dados e controlar equipamentos
                    </p>
                    <p>
                      <strong>Visualizador:</strong> Apenas visualização de dados e relatórios
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invites" className="space-y-4 mt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email..."
                  value={searchInvite}
                  onChange={(e) => setSearchInvite(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex gap-2">
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Convidar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Convidar Membros</DialogTitle>
                      <DialogDescription>
                        Envie convites por email para novos membros da organização
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Emails</Label>
                        <Textarea
                          value={inviteForm.emails}
                          onChange={(e) => setInviteForm({ ...inviteForm, emails: e.target.value })}
                          placeholder={"email1@exemplo.com\nemail2@exemplo.com\nemail3@exemplo.com"}
                          rows={4}
                          className="resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Separe múltiplos emails por linha, vírgula ou ponto e vírgula
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Select
                          value={inviteForm.role}
                          onValueChange={(v: any) => setInviteForm({ ...inviteForm, role: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                            <SelectItem value="operator">Operador</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Mensagem <span className="text-muted-foreground font-normal">(opcional)</span>
                        </Label>
                        <Textarea
                          value={inviteForm.message}
                          onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                          placeholder="Escreva uma mensagem personalizada para o convite..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSendInvites}>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Convites
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {isInvitesLoading && filteredInvites.length === 0 && (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Carregando convites...
              </div>
            )}

            {invitesError && filteredInvites.length === 0 && (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Não foi possível carregar os convites.
              </div>
            )}

            {pendingInvites.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Pendentes ({pendingInvites.length})</p>
                <div className="rounded-lg border divide-y">
                  {pendingInvites.map((invite) => {
                    const remaining = getTimeRemaining(invite.expiresAt)
                    const roleKey = roleToLabelKey(invite.role)
                    return (
                      <div key={invite.id} className="flex items-center justify-between gap-4 p-3 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 shrink-0">
                            <Mail className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{invite.email}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Enviado por {invite.sentBy}</span>
                              <span>/</span>
                              <span>{invite.sentAt}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={roleColors[roleKey]}>
                            {roleLabels[roleKey]}
                          </Badge>
                          {remaining && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{remaining}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resendInvite(invite)}>
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => revokeInviteAction(invite.id)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {filteredInvites.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Nenhum convite encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">Envie convites para adicionar novos membros</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
