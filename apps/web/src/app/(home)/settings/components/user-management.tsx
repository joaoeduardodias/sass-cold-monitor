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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Plus, Shield, Trash2, UserCheck, UserX } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type User = {
  id: number
  name: string
  email: string
  role: "admin" | "operator" | "viewer"
  status: "active" | "inactive"
  lastLogin: string
  createdAt: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "João Silva",
      email: "joao@empresa.com",
      role: "admin",
      status: "active",
      lastLogin: "2024-01-15 14:30",
      createdAt: "2024-01-01",
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@empresa.com",
      role: "operator",
      status: "active",
      lastLogin: "2024-01-15 09:15",
      createdAt: "2024-01-05",
    },
    {
      id: 3,
      name: "Pedro Costa",
      email: "pedro@empresa.com",
      role: "viewer",
      status: "inactive",
      lastLogin: "2024-01-10 16:45",
      createdAt: "2024-01-10",
    },
  ])

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

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Preencha todos os campos")
      return
    }

    const user: User = {
      id: users.length + 1,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "active",
      lastLogin: "Nunca",
      createdAt: new Date().toISOString().split("T")[0],
    }

    setUsers([...users, user])
    setNewUser({ name: "", email: "", role: "viewer" })
    setIsDialogOpen(false)
    toast.success("Usuário adicionado com sucesso!")
  }

  const toggleUserStatus = (id: number) => {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, status: user.status === "active" ? "inactive" : "active" } : user,
      ),
    )
    toast.success("Status do usuário alterado!")
  }

  const deleteUser = (id: number) => {
    setUsers(users.filter((user) => user.id !== id))
    toast.success("Usuário removido!")
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500 hover:bg-red-500">Administrador</Badge>
      case "operator":
        return <Badge className="bg-blue-500 hover:bg-blue-500">Operador</Badge>
      case "viewer":
        return <Badge className="bg-gray-500 hover:bg-gray-500">Visualizador</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-500 hover:bg-green-500">Ativo</Badge>
    ) : (
      <Badge className="bg-gray-500 hover:bg-gray-500">Inativo</Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Usuários do Sistema</h3>
          <p className="text-sm text-muted-foreground">Gerencie usuários e suas permissões de acesso</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Adicionar Usuário
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
              <TableHead>Último Login</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleUserStatus(user.id)}>
                      {user.status === "active" ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
    </div>
  )
}
