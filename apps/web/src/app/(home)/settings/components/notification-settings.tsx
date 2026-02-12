"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { getNotificationSettings } from "@/http/notifications/get-notification-settings"
import { testNotificationEmail } from "@/http/notifications/test-notification-email"
import { updateNotificationSettings } from "@/http/notifications/update-notification-settings"
import { Bell, Mail, Save } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type NotificationSettingsState = {
  emailEnabled: boolean
  emailRecipients: string
  pushEnabled: boolean
  criticalAlerts: boolean
  warningAlerts: boolean
  emailTemplate: string
}

const DEFAULT_SETTINGS: NotificationSettingsState = {
  emailEnabled: true,
  emailRecipients: "",
  pushEnabled: true,
  criticalAlerts: true,
  warningAlerts: true,
  emailTemplate: `Alerta ColdMonitor

Câmara: {chamber_name}
Tipo: {alert_type}
Valor: {current_value}
Limite: {limit_value}
Data/Hora: {timestamp}

Verifique o sistema imediatamente.`,
}

const STORAGE_KEY_PREFIX = "cold-monitor:notification-settings"

const getStorageKey = (pathname: string) => {
  const matched = pathname.match(/\/org\/([^/]+)\//)
  const scope = matched?.[1] ?? "global"
  return `${STORAGE_KEY_PREFIX}:${scope}`
}

type NotificationSettingsProps = {
  organizationSlug?: string
}

export function NotificationSettings({ organizationSlug }: NotificationSettingsProps) {
  const pathname = usePathname()
  const storageKey = useMemo(() => getStorageKey(pathname), [pathname])
  const [settings, setSettings] = useState<NotificationSettingsState>(DEFAULT_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<NotificationSettingsState>(DEFAULT_SETTINGS)

  const [loading, setLoading] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

  const parseRecipientEmails = (value: string) => {
    return value
      .split(/[\n,;]+/g)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  }

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  useEffect(() => {
    let cancelled = false

    const loadSettings = async () => {
      try {
        const raw = localStorage.getItem(storageKey)
        const localSettings: NotificationSettingsState = raw
          ? {
            ...DEFAULT_SETTINGS,
            ...(JSON.parse(raw) || {}),
          }
          : DEFAULT_SETTINGS

        let nextSettings = localSettings
        if (organizationSlug) {
          const { settings: apiSettings } = await getNotificationSettings(organizationSlug)
          nextSettings = {
            ...localSettings,
            emailEnabled: apiSettings.emailEnabled,
            emailRecipients: apiSettings.emailRecipients.join("\n"),
            pushEnabled: apiSettings.pushEnabled,
            criticalAlerts: apiSettings.criticalAlerts,
            warningAlerts: apiSettings.warningAlerts,
            emailTemplate: apiSettings.emailTemplate,
          }
        }

        if (!cancelled) {
          setSettings(nextSettings)
          setSavedSettings(nextSettings)
        }
      } catch {
        if (!cancelled) {
          toast.error("Não foi possível carregar as configurações de notificação.")
          setSettings(DEFAULT_SETTINGS)
          setSavedSettings(DEFAULT_SETTINGS)
        }
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [organizationSlug, storageKey])

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  )

  const handleInputChange = <K extends keyof NotificationSettingsState>(
    field: K,
    value: NotificationSettingsState[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateBeforeSave = () => {
    if (settings.emailEnabled) {
      const recipients = parseRecipientEmails(settings.emailRecipients)
      if (recipients.length === 0) {
        toast.error("Cadastre pelo menos um e-mail destinatário.")
        return false
      }
      if (recipients.some((email) => !isValidEmail(email))) {
        toast.error("Existe e-mail destinatário inválido na lista.")
        return false
      }
    }

    return true
  }

  const handleSave = async () => {
    if (!validateBeforeSave()) return

    setLoading(true)
    try {
      if (organizationSlug) {
        await updateNotificationSettings({
          org: organizationSlug,
          emailEnabled: settings.emailEnabled,
          emailRecipients: parseRecipientEmails(settings.emailRecipients),
          pushEnabled: settings.pushEnabled,
          criticalAlerts: settings.criticalAlerts,
          warningAlerts: settings.warningAlerts,
          emailTemplate: settings.emailTemplate,
        })
      }

      localStorage.setItem(storageKey, JSON.stringify(settings))
      setSavedSettings(settings)
      toast.success("Configurações de notificação salvas!")
    } catch {
      toast.error("Não foi possível salvar as configurações.")
    } finally {
      setLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!organizationSlug) {
      toast.error("Organização não identificada para teste de e-mail.")
      return
    }
    if (!settings.emailEnabled) {
      toast.error("Habilite o envio de e-mail para testar.")
      return
    }

    const recipients = parseRecipientEmails(settings.emailRecipients)
    if (recipients.length === 0) {
      toast.error("Cadastre pelo menos um e-mail destinatário para testar.")
      return
    }
    if (recipients.some((email) => !isValidEmail(email))) {
      toast.error("Existe e-mail destinatário inválido na lista.")
      return
    }

    setTestingEmail(true)
    try {
      await testNotificationEmail({
        org: organizationSlug,
        recipients,
      })
      toast.success("E-mail de teste enviado com sucesso!")
    } catch {
      toast.error("Não foi possível enviar o e-mail de teste.")
    } finally {
      setTestingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Notificações por Email
          </CardTitle>
          <CardDescription>Cadastre os destinatários que devem receber alertas por email</CardDescription>
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
            <div className="space-y-2">
              <Label htmlFor="email-recipients">Destinatários</Label>
              <Textarea
                id="email-recipients"
                value={settings.emailRecipients}
                onChange={(e) => handleInputChange("emailRecipients", e.target.value)}
                rows={4}
                placeholder={"exemplo@empresa.com\nsuporte@empresa.com"}
              />
              <p className="text-xs text-muted-foreground">
                Informe um email por linha, ou separe por vírgula.
              </p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleTestEmail} disabled={testingEmail}>
                  {testingEmail ? "Enviando..." : "Testar Email"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

        </div>

      </div>

      <Separator />

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={loading || !hasChanges}>
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
