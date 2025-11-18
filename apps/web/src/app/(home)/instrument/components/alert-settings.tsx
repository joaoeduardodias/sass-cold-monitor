"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Gauge, Mail, Phone, Thermometer } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function AlertSettings({ id }: { id: string }) {
  const [settings, setSettings] = useState({
    temperature: {
      enabled: true,
      min: -22,
      max: -16,
      criticalMin: -24,
      criticalMax: -14,
    },
    pressure: {
      enabled: true,
      min: 100,
      max: 102,
      criticalMin: 99,
      criticalMax: 103,
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      emailAddress: "admin@example.com",
      phoneNumber: "+55 11 98765-4321",
    },
  })

  const handleTemperatureChange = (field: string, value: number | boolean) => {
    setSettings((prev) => ({
      ...prev,
      temperature: {
        ...prev.temperature,
        [field]: value,
      },
    }))
  }

  const handlePressureChange = (field: string, value: number | boolean) => {
    setSettings((prev) => ({
      ...prev,
      pressure: {
        ...prev.pressure,
        [field]: value,
      },
    }))
  }

  const handleNotificationChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }))
  }

  const handleSave = () => {
    // Aqui seria feita a chamada para salvar as configurações
    toast.success("Configurações salvas com sucesso!")
  }

  return (
    <Tabs defaultValue="temperature">
      <TabsList className="mb-4">
        <TabsTrigger value="temperature" className="flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          Temperatura
        </TabsTrigger>
        <TabsTrigger value="pressure" className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Pressão
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notificações
        </TabsTrigger>
      </TabsList>

      <TabsContent value="temperature">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="temp-enabled" className="font-medium">
              Alertas de Temperatura
            </Label>
            <Switch
              id="temp-enabled"
              checked={settings.temperature.enabled}
              onCheckedChange={(checked) => handleTemperatureChange("enabled", checked)}
            />
          </div>

          <Separator />

          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="temp-min">Temperatura Mínima (Alerta)</Label>
              <Input
                id="temp-min"
                type="number"
                value={settings.temperature.min}
                onChange={(e) => handleTemperatureChange("min", Number.parseFloat(e.target.value))}
                disabled={!settings.temperature.enabled}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="temp-max">Temperatura Máxima (Alerta)</Label>
              <Input
                id="temp-max"
                type="number"
                value={settings.temperature.max}
                onChange={(e) => handleTemperatureChange("max", Number.parseFloat(e.target.value))}
                disabled={!settings.temperature.enabled}
              />
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="temp-critical-min">Temperatura Mínima (Crítico)</Label>
              <Input
                id="temp-critical-min"
                type="number"
                value={settings.temperature.criticalMin}
                onChange={(e) => handleTemperatureChange("criticalMin", Number.parseFloat(e.target.value))}
                disabled={!settings.temperature.enabled}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="temp-critical-max">Temperatura Máxima (Crítico)</Label>
              <Input
                id="temp-critical-max"
                type="number"
                value={settings.temperature.criticalMax}
                onChange={(e) => handleTemperatureChange("criticalMax", Number.parseFloat(e.target.value))}
                disabled={!settings.temperature.enabled}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="pressure">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pressure-enabled" className="font-medium">
              Alertas de Pressão
            </Label>
            <Switch
              id="pressure-enabled"
              checked={settings.pressure.enabled}
              onCheckedChange={(checked) => handlePressureChange("enabled", checked)}
            />
          </div>

          <Separator />

          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="pressure-min">Pressão Mínima (Alerta)</Label>
              <Input
                id="pressure-min"
                type="number"
                value={settings.pressure.min}
                onChange={(e) => handlePressureChange("min", Number.parseFloat(e.target.value))}
                disabled={!settings.pressure.enabled}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pressure-max">Pressão Máxima (Alerta)</Label>
              <Input
                id="pressure-max"
                type="number"
                value={settings.pressure.max}
                onChange={(e) => handlePressureChange("max", Number.parseFloat(e.target.value))}
                disabled={!settings.pressure.enabled}
              />
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="pressure-critical-min">Pressão Mínima (Crítico)</Label>
              <Input
                id="pressure-critical-min"
                type="number"
                value={settings.pressure.criticalMin}
                onChange={(e) => handlePressureChange("criticalMin", Number.parseFloat(e.target.value))}
                disabled={!settings.pressure.enabled}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pressure-critical-max">Pressão Máxima (Crítico)</Label>
              <Input
                id="pressure-critical-max"
                type="number"
                value={settings.pressure.criticalMax}
                onChange={(e) => handlePressureChange("criticalMax", Number.parseFloat(e.target.value))}
                disabled={!settings.pressure.enabled}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="notifications">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Métodos de Notificação</h3>

            <div className="flex items-center space-x-4">
              <div className="flex flex-1 items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <Label htmlFor="email-notify">Email</Label>
              </div>
              <Switch
                id="email-notify"
                checked={settings.notifications.email}
                onCheckedChange={(checked) => handleNotificationChange("email", checked)}
              />
            </div>

            {settings.notifications.email && (
              <div className="ml-7 grid gap-2">
                <Label htmlFor="email-address">Endereço de Email</Label>
                <Input
                  id="email-address"
                  type="email"
                  value={settings.notifications.emailAddress}
                  onChange={(e) => handleNotificationChange("emailAddress", e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="flex flex-1 items-center space-x-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <Label htmlFor="sms-notify">SMS</Label>
              </div>
              <Switch
                id="sms-notify"
                checked={settings.notifications.sms}
                onCheckedChange={(checked) => handleNotificationChange("sms", checked)}
              />
            </div>

            {settings.notifications.sms && (
              <div className="ml-7 grid gap-2">
                <Label htmlFor="phone-number">Número de Telefone</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  value={settings.notifications.phoneNumber}
                  onChange={(e) => handleNotificationChange("phoneNumber", e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="flex flex-1 items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <Label htmlFor="push-notify">Notificações Push</Label>
              </div>
              <Switch
                id="push-notify"
                checked={settings.notifications.push}
                onCheckedChange={(checked) => handleNotificationChange("push", checked)}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </div>
    </Tabs>
  )
}
