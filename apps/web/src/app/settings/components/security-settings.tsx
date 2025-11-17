"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Eye, Key, Save, Shield } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function SecuritySettings() {
  const [settings, setSettings] = useState({
    // Autenticação
    requireTwoFactor: false,
    sessionTimeout: "480", // minutos
    maxLoginAttempts: "5",
    lockoutDuration: "30", // minutos

    // Senhas
    minPasswordLength: "8",
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiry: "90", // dias

    // Logs
    enableAuditLog: true,
    logRetention: "365", // dias
    logFailedLogins: true,
    logDataChanges: true,

    // API
    enableApiAccess: true,
    requireApiKey: true,
    apiRateLimit: "1000", // requests per hour
  })

  const [loading, setLoading] = useState(false)

  // Logs de auditoria simulados
  const [auditLogs] = useState([
    {
      id: 1,
      timestamp: "2024-01-15 14:30:25",
      user: "João Silva",
      action: "Login",
      details: "Login bem-sucedido",
      ip: "192.168.1.100",
      status: "success",
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:25:10",
      user: "Maria Santos",
      action: "Configuração",
      details: "Alterou setpoint da Câmara 01",
      ip: "192.168.1.101",
      status: "success",
    },
    {
      id: 3,
      timestamp: "2024-01-15 14:20:45",
      user: "Desconhecido",
      action: "Login",
      details: "Tentativa de login falhada",
      ip: "192.168.1.200",
      status: "failed",
    },
  ])

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    setLoading(true)

    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.success("Configurações de segurança salvas!")
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    return status === "success" ? (
      <Badge className="bg-green-500 hover:bg-green-500">Sucesso</Badge>
    ) : (
      <Badge className="bg-red-500 hover:bg-red-500">Falha</Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Autenticação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Autenticação
          </CardTitle>
          <CardDescription>Configure políticas de autenticação e sessão</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação de Dois Fatores</Label>
              <p className="text-sm text-muted-foreground">Exigir 2FA para todos os usuários</p>
            </div>
            <Switch
              checked={settings.requireTwoFactor}
              onCheckedChange={(checked) => handleInputChange("requireTwoFactor", checked)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
              <Select
                value={settings.sessionTimeout}
                onValueChange={(value) => handleInputChange("sessionTimeout", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                  <SelectItem value="480">8 horas</SelectItem>
                  <SelectItem value="1440">24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-login-attempts">Máximo de Tentativas de Login</Label>
              <Select
                value={settings.maxLoginAttempts}
                onValueChange={(value) => handleInputChange("maxLoginAttempts", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 tentativas</SelectItem>
                  <SelectItem value="5">5 tentativas</SelectItem>
                  <SelectItem value="10">10 tentativas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockout-duration">Duração do Bloqueio (minutos)</Label>
              <Select
                value={settings.lockoutDuration}
                onValueChange={(value) => handleInputChange("lockoutDuration", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="1440">24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Políticas de Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Políticas de Senha
          </CardTitle>
          <CardDescription>Configure requisitos de segurança para senhas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min-password-length">Comprimento Mínimo</Label>
              <Select
                value={settings.minPasswordLength}
                onValueChange={(value) => handleInputChange("minPasswordLength", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 caracteres</SelectItem>
                  <SelectItem value="8">8 caracteres</SelectItem>
                  <SelectItem value="12">12 caracteres</SelectItem>
                  <SelectItem value="16">16 caracteres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-expiry">Expiração da Senha (dias)</Label>
              <Select
                value={settings.passwordExpiry}
                onValueChange={(value) => handleInputChange("passwordExpiry", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="180">180 dias</SelectItem>
                  <SelectItem value="-1">Nunca expira</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exigir Letras Maiúsculas</Label>
                <p className="text-sm text-muted-foreground">Pelo menos uma letra maiúscula</p>
              </div>
              <Switch
                checked={settings.requireUppercase}
                onCheckedChange={(checked) => handleInputChange("requireUppercase", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exigir Números</Label>
                <p className="text-sm text-muted-foreground">Pelo menos um número</p>
              </div>
              <Switch
                checked={settings.requireNumbers}
                onCheckedChange={(checked) => handleInputChange("requireNumbers", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exigir Caracteres Especiais</Label>
                <p className="text-sm text-muted-foreground">Pelo menos um caractere especial</p>
              </div>
              <Switch
                checked={settings.requireSpecialChars}
                onCheckedChange={(checked) => handleInputChange("requireSpecialChars", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs de Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Logs de Auditoria
          </CardTitle>
          <CardDescription>Configure o registro de atividades do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Log de Auditoria</Label>
              <p className="text-sm text-muted-foreground">Registrar todas as atividades do sistema</p>
            </div>
            <Switch
              checked={settings.enableAuditLog}
              onCheckedChange={(checked) => handleInputChange("enableAuditLog", checked)}
            />
          </div>

          {settings.enableAuditLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="log-retention">Retenção de Logs (dias)</Label>
                  <Select
                    value={settings.logRetention}
                    onValueChange={(value) => handleInputChange("logRetention", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="180">180 dias</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                      <SelectItem value="1825">5 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registrar Tentativas de Login</Label>
                    <p className="text-sm text-muted-foreground">Incluir logins falhados</p>
                  </div>
                  <Switch
                    checked={settings.logFailedLogins}
                    onCheckedChange={(checked) => handleInputChange("logFailedLogins", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registrar Alterações de Dados</Label>
                    <p className="text-sm text-muted-foreground">Mudanças em configurações e dados</p>
                  </div>
                  <Switch
                    checked={settings.logDataChanges}
                    onCheckedChange={(checked) => handleInputChange("logDataChanges", checked)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Security */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança da API</CardTitle>
          <CardDescription>Configure acesso e limites da API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Acesso à API</Label>
              <p className="text-sm text-muted-foreground">Permitir acesso via API REST</p>
            </div>
            <Switch
              checked={settings.enableApiAccess}
              onCheckedChange={(checked) => handleInputChange("enableApiAccess", checked)}
            />
          </div>

          {settings.enableApiAccess && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exigir Chave da API</Label>
                  <p className="text-sm text-muted-foreground">Autenticação obrigatória</p>
                </div>
                <Switch
                  checked={settings.requireApiKey}
                  onCheckedChange={(checked) => handleInputChange("requireApiKey", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-rate-limit">Limite de Requisições (por hora)</Label>
                <Select
                  value={settings.apiRateLimit}
                  onValueChange={(value) => handleInputChange("apiRateLimit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 requisições</SelectItem>
                    <SelectItem value="500">500 requisições</SelectItem>
                    <SelectItem value="1000">1.000 requisições</SelectItem>
                    <SelectItem value="5000">5.000 requisições</SelectItem>
                    <SelectItem value="-1">Sem limite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Logs Recentes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium">Logs de Auditoria Recentes</h3>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
