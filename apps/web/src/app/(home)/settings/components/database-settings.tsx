"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Calendar, Database, Download, HardDrive, Save, Trash2, Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function DatabaseSettings() {
  const [settings, setSettings] = useState({
    // Retenção de dados
    dataRetention: "365", // dias
    autoCleanup: true,

    // Backup
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: "30", // dias
    backupLocation: "/backups/coldmonitor",

    // Compressão
    enableCompression: true,
    compressionLevel: "medium",

    // Exportação
    exportFormat: "csv",
    includeCharts: true,
  })

  const [loading, setLoading] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)

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

    toast.success("Configurações de dados salvas!")
    setLoading(false)
  }

  const createBackup = async () => {
    toast.info("Iniciando backup manual...")
    setBackupProgress(0)

    // Simular progresso do backup
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          toast.success("Backup criado com sucesso!")
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const exportData = async () => {
    toast.info("Preparando exportação de dados...")

    // Simular exportação
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast.success("Dados exportados com sucesso!")
  }

  const cleanupOldData = async () => {
    toast.info("Iniciando limpeza de dados antigos...")

    // Simular limpeza
    await new Promise((resolve) => setTimeout(resolve, 3000))

    toast.success("Limpeza concluída! 1.2GB liberados.")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5 text-blue-600" />
            Status do Banco de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">2.4 GB</div>
              <div className="text-sm text-muted-foreground">Tamanho Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">1.2M</div>
              <div className="text-sm text-muted-foreground">Registros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">365</div>
              <div className="text-sm text-muted-foreground">Dias de Dados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-blue-600" />
            Retenção de Dados
          </CardTitle>
          <CardDescription>Configure por quanto tempo manter os dados históricos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data-retention">Período de Retenção</Label>
            <Select value={settings.dataRetention} onValueChange={(value) => handleInputChange("dataRetention", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">6 meses</SelectItem>
                <SelectItem value="365">1 ano</SelectItem>
                <SelectItem value="730">2 anos</SelectItem>
                <SelectItem value="1825">5 anos</SelectItem>
                <SelectItem value="-1">Nunca excluir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Limpeza Automática</Label>
              <p className="text-sm text-muted-foreground">Excluir dados antigos automaticamente</p>
            </div>
            <Switch
              checked={settings.autoCleanup}
              onCheckedChange={(checked) => handleInputChange("autoCleanup", checked)}
            />
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={cleanupOldData}>
              <Trash2 className="mr-2 size-4" />
              Limpar Dados Antigos
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="size-5 text-blue-600" />
            Configurações de Backup
          </CardTitle>
          <CardDescription>Configure backups automáticos e manuais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Automático</Label>
              <p className="text-sm text-muted-foreground">Criar backups automaticamente</p>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) => handleInputChange("autoBackup", checked)}
            />
          </div>

          {settings.autoBackup && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Frequência</Label>
                  <Select
                    value={settings.backupFrequency}
                    onValueChange={(value) => handleInputChange("backupFrequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">A cada hora</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-retention">Retenção de Backups</Label>
                  <Select
                    value={settings.backupRetention}
                    onValueChange={(value) => handleInputChange("backupRetention", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-location">Local do Backup</Label>
                <Input
                  id="backup-location"
                  value={settings.backupLocation}
                  onChange={(e) => handleInputChange("backupLocation", e.target.value)}
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Backup Manual</h4>
                <p className="text-sm text-muted-foreground">Criar backup imediatamente</p>
              </div>
              <Button onClick={createBackup} disabled={backupProgress > 0 && backupProgress < 100}>
                <Download className="mr-2 size-4" />
                Criar Backup
              </Button>
            </div>

            {backupProgress > 0 && backupProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso do backup</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compressão de Dados</CardTitle>
          <CardDescription>Configure a compressão para economizar espaço</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Compressão</Label>
              <p className="text-sm text-muted-foreground">Comprimir dados históricos</p>
            </div>
            <Switch
              checked={settings.enableCompression}
              onCheckedChange={(checked) => handleInputChange("enableCompression", checked)}
            />
          </div>

          {settings.enableCompression && (
            <div className="space-y-2">
              <Label htmlFor="compression-level">Nível de Compressão</Label>
              <Select
                value={settings.compressionLevel}
                onValueChange={(value) => handleInputChange("compressionLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo (rápido)</SelectItem>
                  <SelectItem value="medium">Médio (balanceado)</SelectItem>
                  <SelectItem value="high">Alto (máxima compressão)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportação de Dados</CardTitle>
          <CardDescription>Configure opções de exportação de relatórios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="export-format">Formato Padrão</Label>
              <Select value={settings.exportFormat} onValueChange={(value) => handleInputChange("exportFormat", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Incluir Gráficos</Label>
              <p className="text-sm text-muted-foreground">Incluir gráficos nas exportações</p>
            </div>
            <Switch
              checked={settings.includeCharts}
              onCheckedChange={(checked) => handleInputChange("includeCharts", checked)}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={exportData}>
              <Upload className="mr-2 size-4" />
              Exportar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
