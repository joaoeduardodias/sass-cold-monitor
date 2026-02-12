"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Monitor, Moon, Palette, Save, Smartphone, Sun } from "lucide-react"
import { toast } from "sonner"

export function AppearanceSettings() {
  const [settings, setSettings] = useState({
    theme: "system",
    primaryColor: "blue",

    sidebarCollapsed: false,
    compactMode: false,
    showAnimations: true,

    cardsPerRow: "4",
    showMiniCharts: true,
    autoRefreshVisual: true,

    chartTheme: "modern",
    showGridLines: true,
    animatedCharts: true,
    chartHeight: [300],

    density: "comfortable",
    fontSize: "medium",
  })

  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string | boolean | number[]) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    setLoading(true)

    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.success("Configurações de aparência salvas!")
    setLoading(false)
  }

  const colorOptions = [
    { value: "blue", label: "Azul", color: "bg-blue-500" },
    { value: "green", label: "Verde", color: "bg-green-500" },
    { value: "purple", label: "Roxo", color: "bg-purple-500" },
    { value: "orange", label: "Laranja", color: "bg-orange-500" },
    { value: "red", label: "Vermelho", color: "bg-red-500" },
    { value: "teal", label: "Teal", color: "bg-teal-500" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-600" />
            Tema e Cores
          </CardTitle>
          <CardDescription>Personalize a aparência geral do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select value={settings.theme} onValueChange={(value) => handleInputChange("theme", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Claro
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Escuro
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Sistema
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cor Principal</Label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleInputChange("primaryColor", color.value)}
                  className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${settings.primaryColor === color.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  <div className={`w-4 h-4 rounded-full ${color.color}`} />
                  <span className="text-sm">{color.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout e Navegação</CardTitle>
          <CardDescription>Configure a disposição dos elementos na tela</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Barra Lateral Recolhida</Label>
              <p className="text-sm text-muted-foreground">Iniciar com sidebar minimizada</p>
            </div>
            <Switch
              checked={settings.sidebarCollapsed}
              onCheckedChange={(checked) => handleInputChange("sidebarCollapsed", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Compacto</Label>
              <p className="text-sm text-muted-foreground">Reduzir espaçamentos e margens</p>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(checked) => handleInputChange("compactMode", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Animações</Label>
              <p className="text-sm text-muted-foreground">Habilitar transições e animações</p>
            </div>
            <Switch
              checked={settings.showAnimations}
              onCheckedChange={(checked) => handleInputChange("showAnimations", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="density">Densidade da Interface</Label>
            <Select value={settings.density} onValueChange={(value) => handleInputChange("density", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compacta</SelectItem>
                <SelectItem value="comfortable">Confortável</SelectItem>
                <SelectItem value="spacious">Espaçosa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-size">Tamanho da Fonte</Label>
            <Select value={settings.fontSize} onValueChange={(value) => handleInputChange("fontSize", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequena</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Configure a visualização da página principal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cards-per-row">Cards por Linha</Label>
            <Select value={settings.cardsPerRow} onValueChange={(value) => handleInputChange("cardsPerRow", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 cards</SelectItem>
                <SelectItem value="3">3 cards</SelectItem>
                <SelectItem value="4">4 cards</SelectItem>
                <SelectItem value="6">6 cards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mini Gráficos</Label>
              <p className="text-sm text-muted-foreground">Mostrar gráficos pequenos nos cards</p>
            </div>
            <Switch
              checked={settings.showMiniCharts}
              onCheckedChange={(checked) => handleInputChange("showMiniCharts", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Atualização Visual</Label>
              <p className="text-sm text-muted-foreground">Destacar dados quando atualizados</p>
            </div>
            <Switch
              checked={settings.autoRefreshVisual}
              onCheckedChange={(checked) => handleInputChange("autoRefreshVisual", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gráficos e Visualizações</CardTitle>
          <CardDescription>Personalize a aparência dos gráficos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chart-theme">Tema dos Gráficos</Label>
            <Select value={settings.chartTheme} onValueChange={(value) => handleInputChange("chartTheme", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Moderno</SelectItem>
                <SelectItem value="classic">Clássico</SelectItem>
                <SelectItem value="minimal">Minimalista</SelectItem>
                <SelectItem value="colorful">Colorido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Linhas de Grade</Label>
              <p className="text-sm text-muted-foreground">Mostrar grade nos gráficos</p>
            </div>
            <Switch
              checked={settings.showGridLines}
              onCheckedChange={(checked) => handleInputChange("showGridLines", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Gráficos Animados</Label>
              <p className="text-sm text-muted-foreground">Animar entrada dos dados</p>
            </div>
            <Switch
              checked={settings.animatedCharts}
              onCheckedChange={(checked) => handleInputChange("animatedCharts", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="chart-height">Altura dos Gráficos: {settings.chartHeight[0]}px</Label>
            </div>
            <Slider
              id="chart-height"
              min={200}
              max={600}
              step={50}
              value={settings.chartHeight}
              onValueChange={(value) => handleInputChange("chartHeight", value)}
              className="py-4"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>Veja como ficará a interface com suas configurações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <Smartphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Pré-visualização será implementada em breve</p>
          </div>
        </CardContent>
      </Card>

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
