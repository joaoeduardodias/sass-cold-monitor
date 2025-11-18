"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Building, Calendar, Mail, Save, Shield, Upload, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    name: "João Silva",
    email: "joao@empresa.com",
    phone: "+55 11 98765-4321",
    company: "Empresa Exemplo Ltda",
    position: "Gerente de Operações",
    department: "Logística",
    avatar: "/placeholder.svg?height=128&width=128",
    joinDate: "2023-01-15",
    lastLogin: "2024-01-15 14:30:25",
    role: "Administrador",
    permissions: ["Visualizar", "Editar", "Configurar", "Gerenciar Usuários"],
  })

  const handleInputChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    setLoading(true)

    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.success("Perfil atualizado com sucesso!")
    setLoading(false)
  }

  const handleAvatarUpload = () => {
    // Simular upload de avatar
    toast.info("Funcionalidade de upload será implementada em breve")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar com Avatar e Info Básica */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <Avatar className="size-24">
                  <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
                  <AvatarFallback className="bg-blue-600 text-white text-2xl">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{profile.name}</CardTitle>
              <CardDescription>{profile.position}</CardDescription>
              <Badge className="bg-blue-600 hover:bg-blue-600 w-fit mx-auto">{profile.role}</Badge>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" onClick={handleAvatarUpload} className="w-full">
                <Upload className="mr-2 size-4" />
                Alterar Foto
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-blue-600" />
                Permissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">{permission}</span>
                  </div>
                ))}
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
                <p className="text-sm font-medium">{new Date(profile.joinDate).toLocaleDateString("pt-BR")}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Último Login</Label>
                <p className="text-sm font-medium">{profile.lastLogin}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-blue-600" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={profile.name} onChange={(e) => handleInputChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={profile.position}
                    onChange={(e) => handleInputChange("position", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={profile.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                />
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={profile.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="size-5 text-blue-600" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>Informações relacionadas à sua empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/">Cancelar</Link>
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
