"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Mail, MessageSquare, Save } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    // Email
    emailEnabled: true,
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "sistema@empresa.com",
    smtpPassword: "",
    emailFrom: "ColdMonitor <sistema@empresa.com>",

    // SMS
    smsEnabled: false,
    smsProvider: "twilio",
    smsApiKey: "",
    smsFrom: "+5511999999999",

    // Push Notifications
    pushEnabled: true,

    // Configurações de Alerta
    criticalAlerts: true,
    warningAlerts: true,
    infoAlerts: false,
    alertCooldown: "300", // segundos

    // Templates
    emailTemplate: `Alerta ColdMonitor

Câmara: {chamber_name}
Tipo: {alert_type}
Valor: {current_value}
Limite: {limit_value}
Data/Hora: {timestamp}

Verifique o sistema imediatamente.`,

    smsTemplate: "ALERTA {chamber_name}: {alert_type} - {current_value}. Verificar sistema.",
  })

  const [loading, setLoading] = useState(false)

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

    toast.success("Configurações de notificação salvas!")
    setLoading(false)
  }

  const testEmail = async () => {
    toast.info("Enviando email de teste...")

    // Simular envio
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast.success("Email de teste enviado com sucesso!")
  }

  const testSMS = async () => {
    toast.info("Enviando SMS de teste...")

    // Simular envio
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast.success("SMS de teste enviado com sucesso!")
  }

  return (
    <div className="space-y-6">
      {/* Configurações de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Notificações por Email
          </CardTitle>
          <CardDescription>Configure o servidor SMTP para envio de emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Email</Label>
              <p className="text-sm text-muted-foreground">Enviar alertas por email</p>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => handleInputChange("emailEnabled", checked)}
            />
          </div>

          {settings.emailEnabled && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">Servidor SMTP</Label>
                  <Input
                    id="smtp-server"
                    value={settings.smtpServer}
                    onChange={(e) => handleInputChange("smtpServer", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Porta</Label>
                  <Input
                    id="smtp-port"
                    value={settings.smtpPort}
                    onChange={(e) => handleInputChange("smtpPort", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Usuário</Label>
                  <Input
                    id="smtp-user"
                    value={settings.smtpUser}
                    onChange={(e) => handleInputChange("smtpUser", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Senha</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => handleInputChange("smtpPassword", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-from">Remetente</Label>
                <Input
                  id="email-from"
                  value={settings.emailFrom}
                  onChange={(e) => handleInputChange("emailFrom", e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={testEmail}>
                  Testar Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de SMS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Notificações por SMS
          </CardTitle>
          <CardDescription>Configure o provedor de SMS para alertas críticos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar SMS</Label>
              <p className="text-sm text-muted-foreground">Enviar alertas por SMS</p>
            </div>
            <Switch
              checked={settings.smsEnabled}
              onCheckedChange={(checked) => handleInputChange("smsEnabled", checked)}
            />
          </div>

          {settings.smsEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sms-provider">Provedor</Label>
                <Select value={settings.smsProvider} onValueChange={(value) => handleInputChange("smsProvider", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="nexmo">Nexmo</SelectItem>
                    <SelectItem value="aws-sns">AWS SNS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sms-api-key">API Key</Label>
                  <Input
                    id="sms-api-key"
                    type="password"
                    value={settings.smsApiKey}
                    onChange={(e) => handleInputChange("smsApiKey", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sms-from">Número Remetente</Label>
                  <Input
                    id="sms-from"
                    value={settings.smsFrom}
                    onChange={(e) => handleInputChange("smsFrom", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={testSMS}>
                  Testar SMS
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notificações Push
          </CardTitle>
          <CardDescription>Notificações no navegador e aplicativo móvel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Push</Label>
              <p className="text-sm text-muted-foreground">Notificações em tempo real</p>
            </div>
            <Switch
              checked={settings.pushEnabled}
              onCheckedChange={(checked) => handleInputChange("pushEnabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Configurações de Alerta */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tipos de Alerta</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas Críticos</Label>
              <p className="text-sm text-muted-foreground">Temperaturas fora dos limites críticos</p>
            </div>
            <Switch
              checked={settings.criticalAlerts}
              onCheckedChange={(checked) => handleInputChange("criticalAlerts", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Atenção</Label>
              <p className="text-sm text-muted-foreground">Temperaturas próximas aos limites</p>
            </div>
            <Switch
              checked={settings.warningAlerts}
              onCheckedChange={(checked) => handleInputChange("warningAlerts", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas Informativos</Label>
              <p className="text-sm text-muted-foreground">Mudanças de status e eventos</p>
            </div>
            <Switch
              checked={settings.infoAlerts}
              onCheckedChange={(checked) => handleInputChange("infoAlerts", checked)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="alert-cooldown">Intervalo entre Alertas (segundos)</Label>
          <Select value={settings.alertCooldown} onValueChange={(value) => handleInputChange("alertCooldown", value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">1 minuto</SelectItem>
              <SelectItem value="300">5 minutos</SelectItem>
              <SelectItem value="600">10 minutos</SelectItem>
              <SelectItem value="1800">30 minutos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Templates */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Templates de Mensagem</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-template">Template de Email</Label>
            <Textarea
              id="email-template"
              value={settings.emailTemplate}
              onChange={(e) => handleInputChange("emailTemplate", e.target.value)}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {"{chamber_name}"}, {"{alert_type}"}, {"{current_value}"}, {"{limit_value}"},{" "}
              {"{timestamp}"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sms-template">Template de SMS</Label>
            <Textarea
              id="sms-template"
              value={settings.smsTemplate}
              onChange={(e) => handleInputChange("smsTemplate", e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Mantenha curto (máx. 160 caracteres). Mesmas variáveis disponíveis.
            </p>
          </div>
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
