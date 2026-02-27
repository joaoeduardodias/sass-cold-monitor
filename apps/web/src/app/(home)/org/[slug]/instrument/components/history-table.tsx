"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertTriangle,
  ChevronLeft, ChevronRight, Database, Printer, RotateCcw, Save, Search, Settings, TrendingUp,
  Zap
} from "lucide-react"

import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

type Reading = {
  id: number
  timestamp: string
  temperature: number
  pressure: number
  humidity: number
  status: "normal" | "warning" | "critical"
  originalTemperature?: number
  originalPressure?: number
  originalHumidity?: number
  edited?: boolean
  generated?: boolean
}

type ChartData = {
  time: string
  temperature: number
  pressure: number
  humidity: number
}

type ChartConfig = {
  limitValue: string
  tempVariation: string
  minValue: string
  maxValue: string
}

interface HistoryTableProps {
  id: string
  instrumentName: string
}
type DataGenerationConfig = {
  startDate: string
  endDate: string
  interval: string
  baseTemperature: string
  temperatureVariation: string
  basePressure: string
  pressureVariation: string
  baseHumidity: string
  humidityVariation: string
  pattern: "linear" | "sinusoidal" | "random" | "realistic"
  overwriteExisting: boolean
}

export function HistoryTable({ id, instrumentName }: HistoryTableProps) {
  const [readings, setReadings] = useState<Reading[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  // Filtros e configurações
  const [startDate, setStartDate] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [chartInterval, setChartInterval] = useState("30") // minutos
  const [tableInterval, setTableInterval] = useState("10") // minutos
  const [tempFilter, setTempFilter] = useState({ min: "", max: "" })

  // Configurações do gráfico
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    limitValue: "",
    tempVariation: "1",
    minValue: "",
    maxValue: "",
  })
  // Configurações de geração de dados
  const [dataGenConfig, setDataGenConfig] = useState<DataGenerationConfig>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    interval: "15",
    baseTemperature: "-20",
    temperatureVariation: "2",
    basePressure: "101",
    pressureVariation: "0.5",
    baseHumidity: "85",
    humidityVariation: "5",
    pattern: "realistic",
    overwriteExisting: false,
  })


  const generateDataPoints = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    const start = new Date(dataGenConfig.startDate)
    const end = new Date(dataGenConfig.endDate)
    const intervalMs = Number.parseInt(dataGenConfig.interval) * 60 * 1000
    const baseTemp = Number.parseFloat(dataGenConfig.baseTemperature)
    const tempVar = Number.parseFloat(dataGenConfig.temperatureVariation)
    const basePressure = Number.parseFloat(dataGenConfig.basePressure)
    const pressureVar = Number.parseFloat(dataGenConfig.pressureVariation)
    const baseHumidity = Number.parseFloat(dataGenConfig.baseHumidity)
    const humidityVar = Number.parseFloat(dataGenConfig.humidityVariation)

    const newReadings: Reading[] = []
    let generatedCount = 0

    // Simular progresso
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    for (let time = start.getTime(); time <= end.getTime(); time += intervalMs) {
      const date = new Date(time)
      let temp: number
      let pressure: number
      let humidity: number

      // Aplicar padrão selecionado
      switch (dataGenConfig.pattern) {
        case "linear":
          const progress = (time - start.getTime()) / (end.getTime() - start.getTime())
          temp = baseTemp + (progress * tempVar * 2 - tempVar)
          pressure = basePressure + (progress * pressureVar * 2 - pressureVar)
          humidity = baseHumidity + (progress * humidityVar * 2 - humidityVar)
          break

        case "sinusoidal":
          const cycles = 2 // 2 ciclos completos no período
          const phase = ((time - start.getTime()) / (end.getTime() - start.getTime())) * cycles * 2 * Math.PI
          temp = baseTemp + Math.sin(phase) * tempVar
          pressure = basePressure + Math.cos(phase) * pressureVar
          humidity = baseHumidity + Math.sin(phase + Math.PI / 4) * humidityVar
          break

        case "random":
          temp = baseTemp + (Math.random() * 2 - 1) * tempVar
          pressure = basePressure + (Math.random() * 2 - 1) * pressureVar
          humidity = baseHumidity + (Math.random() * 2 - 1) * humidityVar
          break

        case "realistic":
        default:
          // Padrão realístico com variações naturais
          const hourOfDay = date.getHours()
          const dailyCycle = Math.sin((hourOfDay / 24) * 2 * Math.PI)
          const randomNoise = (Math.random() * 2 - 1) * 0.3

          temp = baseTemp + dailyCycle * tempVar * 0.5 + randomNoise * tempVar
          pressure =
            basePressure + Math.cos(time / (6 * 60 * 60 * 1000)) * pressureVar + randomNoise * pressureVar * 0.2
          humidity =
            baseHumidity + Math.sin(time / (4 * 60 * 60 * 1000)) * humidityVar + randomNoise * humidityVar * 0.3
          break
      }

      const status = temp > baseTemp + tempVar ? "critical" : temp > baseTemp + tempVar * 0.5 ? "warning" : "normal"

      newReadings.push({
        id: Date.now() + generatedCount,
        timestamp: date.toLocaleString(),
        temperature: Number(temp.toFixed(2)),
        pressure: Number(pressure.toFixed(2)),
        humidity: Number(humidity.toFixed(1)),
        status,
        generated: true,
      })

      generatedCount++
    }

    clearInterval(progressInterval)
    setGenerationProgress(100)

    // Adicionar os novos dados
    if (dataGenConfig.overwriteExisting) {
      setReadings(newReadings)
    } else {
      setReadings((prev) =>
        [...newReadings, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      )
    }

    setTimeout(() => {
      setIsGenerating(false)
      setGenerationProgress(0)
      setGenerateDialogOpen(false)
      toast.success(`${generatedCount} pontos de dados gerados com sucesso!`)
    }, 500)
  }


  const itemsPerPage = 15
  const totalPages = 10

  useEffect(() => {
    loadData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, startDate, endDate, chartInterval, tableInterval, chartConfig])

  const loadData = () => {
    setLoading(true)

    setTimeout(() => {
      // Gerar dados para o gráfico (intervalos maiores)
      const chartPoints = generateChartData()
      setChartData(chartPoints)

      // Gerar dados para a tabela (intervalos menores)
      const tableData = generateTableData()
      setReadings(tableData)

      setLoading(false)
    }, 500)
  }

  const generateChartData = (): ChartData[] => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const intervalMs = Number.parseInt(chartInterval) * 60 * 1000
    const points: ChartData[] = []

    // Usar configurações personalizadas ou valores padrão
    const variation = Number.parseFloat(chartConfig.tempVariation) || 1
    const minTemp = chartConfig.minValue ? Number.parseFloat(chartConfig.minValue) : -35
    const maxTemp = chartConfig.maxValue ? Number.parseFloat(chartConfig.maxValue) : 105

    for (let time = start.getTime(); time <= end.getTime(); time += intervalMs) {
      const date = new Date(time)
      const baseTemp = -18

      // Aplicar variação personalizada
      let temp = baseTemp + Math.sin(time / (4 * 60 * 60 * 1000)) * 2 * variation + Math.random() * 1.5 * variation

      // Garantir que a temperatura esteja dentro dos limites
      temp = Math.max(minTemp, Math.min(maxTemp, temp))

      points.push({
        time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        temperature: temp,
        pressure: 101 + Math.cos(time / (6 * 60 * 60 * 1000)) * 0.5 + Math.random() * 0.3,
        humidity: 85 + Math.sin(time / (3 * 60 * 60 * 1000)) * 3 + Math.random() * 2,
      })
    }

    return points.slice(-50) // Últimos 50 pontos para o gráfico
  }

  const generateTableData = (): Reading[] => {
    const now = new Date()
    const intervalMs = Number.parseInt(tableInterval) * 60 * 1000
    const data: Reading[] = []

    for (let i = 0; i < itemsPerPage; i++) {
      const offset = (page - 1) * itemsPerPage + i
      const time = new Date(now.getTime() - offset * intervalMs)
      const baseTemp = -18
      const temp = baseTemp + Math.sin(offset / 4) * 2 + Math.random() * 1.5
      const status = temp > -16 ? "critical" : temp > -18 ? "warning" : "normal"

      data.push({
        id: offset + 1,
        timestamp: time.toLocaleString(),
        temperature: temp,
        pressure: 101 + Math.cos(offset / 6) * 0.5 + Math.random() * 0.3,
        humidity: 85 + Math.sin(offset / 3) * 3 + Math.random() * 2,
        status,
      })
    }

    return data
  }

  const handlePrint = () => {
    // Criar estilos específicos para impressão
    const printStyles = `
      <style>
        @media print {
          body * { visibility: hidden; }
          #history-print-area, #history-print-area * { visibility: visible; }
          #history-print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
          }
          .no-print { display: none !important; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
          }
          th, td { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
          }
          .print-header {
            margin-bottom: 20px;
            text-align: center;
          }
          .print-info {
            margin-bottom: 15px;
            font-size: 14px;
          }
        }
      </style>
    `

    // Adicionar estilos ao head temporariamente
    const styleElement = document.createElement("style")
    styleElement.innerHTML = printStyles
    document.head.appendChild(styleElement)

    // Executar impressão
    window.print()

    // Remover estilos após impressão
    setTimeout(() => {
      document.head.removeChild(styleElement)
    }, 1000)

    toast.success("Preparando impressão do histórico")
  }

  const handleChartConfigChange = (field: keyof ChartConfig, value: string) => {
    setChartConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetChartConfig = () => {
    setChartConfig({
      limitValue: "",
      tempVariation: "1",
      minValue: "",
      maxValue: "",
    })
    toast.info("Configurações do gráfico restauradas")
  }

  const handleCellDoubleClick = (reading: Reading, field: string) => {
    setEditingCell({ id: reading.id, field })
    setEditValue(reading[field as keyof Reading]?.toString() || "")
  }

  const handleCellEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveCellEdit()
    } else if (e.key === "Escape") {
      setEditingCell(null)
      setEditValue("")
    }
  }

  const saveCellEdit = () => {
    if (!editingCell) return

    const newValue = Number.parseFloat(editValue)
    if (isNaN(newValue)) {
      toast.error("Valor inválido")
      return
    }

    setReadings((prev) =>
      prev.map((reading) => {
        if (reading.id === editingCell.id) {
          const updated = { ...reading }

          // Salvar valor original se for a primeira edição
          if (!updated.edited) {
            updated.originalTemperature = reading.temperature
            updated.originalPressure = reading.pressure
            updated.originalHumidity = reading.humidity
          }

          // Atualizar o campo editado
          if (editingCell.field === "temperature") {
            updated.temperature = newValue
          } else if (editingCell.field === "pressure") {
            updated.pressure = newValue
          } else if (editingCell.field === "humidity") {
            updated.humidity = newValue
          }
          updated.edited = true

          return updated
        }
        return reading
      }),
    )

    setHasChanges(true)
    setEditingCell(null)
    setEditValue("")
    toast.success("Valor alterado")
  }

  const saveAllChanges = () => {
    // Simular salvamento
    setTimeout(() => {
      setHasChanges(false)
      toast.success("Alterações salvas com sucesso")
    }, 1000)
  }

  const resetChanges = () => {
    setReadings((prev) =>
      prev.map((reading) => {
        if (reading.edited && reading.originalTemperature !== undefined) {
          return {
            ...reading,
            temperature: reading.originalTemperature,
            pressure: reading.originalPressure!,
            humidity: reading.originalHumidity!,
            edited: false,
            originalTemperature: undefined,
            originalPressure: undefined,
            originalHumidity: undefined,
          }
        }
        return reading
      }),
    )
    setHasChanges(false)
    toast.info("Alterações desfeitas")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return ""
    }
  }

  const filteredReadings = readings.filter((reading) => {
    const temp = reading.temperature
    const minTemp = tempFilter.min ? Number.parseFloat(tempFilter.min) : Number.NEGATIVE_INFINITY
    const maxTemp = tempFilter.max ? Number.parseFloat(tempFilter.max) : Number.POSITIVE_INFINITY
    return temp >= minTemp && temp <= maxTemp
  })

  // Calcular domínio do eixo Y baseado nas configurações
  const getYAxisDomain = () => {
    const minValue = chartConfig.minValue ? Number.parseFloat(chartConfig.minValue) : undefined
    const maxValue = chartConfig.maxValue ? Number.parseFloat(chartConfig.maxValue) : undefined

    if (minValue !== undefined && maxValue !== undefined) {
      return [minValue, maxValue]
    }

    return ["auto", "auto"]
  }

  return (
    <div className="space-y-6">
      {/* Área de impressão */}
      <div id="history-print-area" style={{ display: "none" }}>
        <div className="print-header">
          <h1>Histórico de Leituras - {instrumentName}</h1>
          <p>Relatório gerado em: {new Date().toLocaleString()}</p>
        </div>
        <div className="print-info">
          <p>
            <strong>Período:</strong> {startDate} a {endDate}
          </p>
          <p>
            <strong>Intervalo:</strong> {tableInterval} minutos
          </p>
          <p>
            <strong>Total de registros:</strong> {filteredReadings.length}
          </p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Temperatura (°C)</th>
              <th>Pressão (kPa)</th>
              <th>Umidade (%)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReadings.map((reading) => (
              <tr key={reading.id}>
                <td>{reading.timestamp}</td>
                <td>{reading.temperature.toFixed(2)}</td>
                <td>{reading.pressure.toFixed(2)}</td>
                <td>{reading.humidity.toFixed(1)}</td>
                <td>
                  {reading.status === "normal" && "Normal"}
                  {reading.status === "warning" && "Atenção"}
                  {reading.status === "critical" && "Crítico"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botão de Gerar/Imprimir */}
      <div className="flex justify-between">
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Database className="mr-2 size-4" />
              Gerar Dados
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="size-5 text-blue-600" />
                Gerador de Dados Históricos
              </DialogTitle>
              <DialogDescription>Gere dados para períodos onde não houve coleta automática</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Período */}
              <div className="space-y-4">
                <h4 className="font-medium">Período de Geração</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gen-start-date">Data Inicial</Label>
                    <Input
                      id="gen-start-date"
                      type="date"
                      value={dataGenConfig.startDate}
                      onChange={(e) => setDataGenConfig({ ...dataGenConfig, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gen-end-date">Data Final</Label>
                    <Input
                      id="gen-end-date"
                      type="date"
                      value={dataGenConfig.endDate}
                      onChange={(e) => setDataGenConfig({ ...dataGenConfig, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gen-interval">Intervalo (minutos)</Label>
                  <Select
                    value={dataGenConfig.interval}
                    onValueChange={(value) => setDataGenConfig({ ...dataGenConfig, interval: value })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Parâmetros */}
              <div className="space-y-4">
                <h4 className="font-medium">Parâmetros Base</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="base-temp">Temperatura Base (°C)</Label>
                    <Input
                      id="base-temp"
                      type="number"
                      value={dataGenConfig.baseTemperature}
                      onChange={(e) => setDataGenConfig({ ...dataGenConfig, baseTemperature: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temp-var">Variação Temperatura (±°C)</Label>
                    <Input
                      id="temp-var"
                      type="number"
                      step="0.1"
                      value={dataGenConfig.temperatureVariation}
                      onChange={(e) => setDataGenConfig({ ...dataGenConfig, temperatureVariation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base-pressure">Pressão Base (kPa)</Label>
                    <Input
                      id="base-pressure"
                      type="number"
                      value={dataGenConfig.basePressure}
                      onChange={(e) => setDataGenConfig({ ...dataGenConfig, basePressure: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pressure-var">Variação Pressão (±kPa)</Label>
                    <Input
                      id="pressure-var"
                      type="number"
                      step="0.1"
                      value={dataGenConfig.pressureVariation}
                      onChange={(e) => setDataGenConfig({ ...dataGenConfig, pressureVariation: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Padrão de Geração */}
              <div className="space-y-4">
                <h4 className="font-medium">Padrão de Geração</h4>
                <Select
                  value={dataGenConfig.pattern}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onValueChange={(value: any) => setDataGenConfig({ ...dataGenConfig, pattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realístico (recomendado)</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="sinusoidal">Senoidal</SelectItem>
                    <SelectItem value="random">Aleatório</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {dataGenConfig.pattern === "realistic" && "Simula variações naturais com ciclos diários"}
                  {dataGenConfig.pattern === "linear" && "Variação linear do início ao fim do período"}
                  {dataGenConfig.pattern === "sinusoidal" && "Padrão senoidal com ciclos regulares"}
                  {dataGenConfig.pattern === "random" && "Valores aleatórios dentro dos limites"}
                </p>
              </div>

              <Separator />

              {/* Opções */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sobrescrever Dados Existentes</Label>
                    <p className="text-sm text-muted-foreground">Substituir todos os dados atuais</p>
                  </div>
                  <Switch
                    checked={dataGenConfig.overwriteExisting}
                    onCheckedChange={(checked) => setDataGenConfig({ ...dataGenConfig, overwriteExisting: checked })}
                  />
                </div>

                {dataGenConfig.overwriteExisting && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="size-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Atenção: Esta ação irá remover todos os dados existentes
                    </span>
                  </div>
                )}
              </div>

              {/* Progresso */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gerando dados...</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} />
                </div>
              )}

              {/* Botões */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setGenerateDialogOpen(false)} disabled={isGenerating}>
                  Cancelar
                </Button>
                <Button onClick={generateDataPoints} disabled={isGenerating}>
                  {isGenerating ? "Gerando..." : "Gerar Dados"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 size-4" />
          Imprimir Histórico
        </Button>
      </div>

      {/* Configurações e Filtros */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Data Inicial</Label>
          <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">Data Final</Label>
          <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Intervalo Gráfico</Label>
          <Select value={chartInterval} onValueChange={setChartInterval}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="120">2 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Intervalo Tabela</Label>
          <Select value={tableInterval} onValueChange={setTableInterval}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutos</SelectItem>
              <SelectItem value="10">10 minutos</SelectItem>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Configurações do Gráfico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Configurações do Gráfico
            </CardTitle>
            <Button variant="outline" size="sm" onClick={resetChartConfig}>
              <RotateCcw className="mr-2 size-4" />
              Restaurar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="limit-value">Valor Limite (°C)</Label>
              <Input
                id="limit-value"
                type="number"
                placeholder="Ex: -18"
                value={chartConfig.limitValue}
                onChange={(e) => handleChartConfigChange("limitValue", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Linha vermelha no gráfico</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-variation">Variação de Temperatura</Label>
              <Input
                id="temp-variation"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={chartConfig.tempVariation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChartConfigChange("tempVariation", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Multiplicador da variação</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-value">Valor Mínimo (°C)</Label>
              <Input
                id="min-value"
                type="number"
                placeholder="Ex: -35"
                value={chartConfig.minValue}
                onChange={(e) => handleChartConfigChange("minValue", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Limite inferior do eixo Y</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-value">Valor Máximo (°C)</Label>
              <Input
                id="max-value"
                type="number"
                placeholder="Ex: 105"
                value={chartConfig.maxValue}
                onChange={(e) => handleChartConfigChange("maxValue", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Limite superior do eixo Y</p>
            </div>
          </div>

          {/* Indicadores visuais das configurações ativas */}
          <div className="mt-4 flex flex-wrap gap-2">
            {chartConfig.limitValue && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Limite: {chartConfig.limitValue}°C
              </div>
            )}
            {chartConfig.tempVariation !== "1" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Variação: {chartConfig.tempVariation}x
              </div>
            )}
            {(chartConfig.minValue || chartConfig.maxValue) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Range: {chartConfig.minValue || "auto"} a {chartConfig.maxValue || "auto"}°C
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Linha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Tendência Histórica
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-muted-foreground">Carregando gráfico...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={getYAxisDomain()} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}${name === "temperature" ? "°C" : name === "pressure" ? " kPa" : "%"}`,
                    name === "temperature" ? "Temperatura" : name === "pressure" ? "Pressão" : "Umidade",
                  ]}
                />

                {/* Linha de limite se configurada */}
                {chartConfig.limitValue && (
                  <ReferenceLine
                    y={Number.parseFloat(chartConfig.limitValue)}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ value: `Limite: ${chartConfig.limitValue}°C`, position: "insideTopRight" }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                  name="temperature"
                />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                  name="pressure"
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 3 }}
                  name="humidity"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Filtros da Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Filtros de Temperatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="temp-min">Temperatura Mínima (°C)</Label>
              <Input
                id="temp-min"
                type="number"
                placeholder="Ex: -25"
                value={tempFilter.min}
                onChange={(e) => setTempFilter((prev) => ({ ...prev, min: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-max">Temperatura Máxima (°C)</Label>
              <Input
                id="temp-max"
                type="number"
                placeholder="Ex: -10"
                value={tempFilter.max}
                onChange={(e) => setTempFilter((prev) => ({ ...prev, max: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setTempFilter({ min: "", max: "" })} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Edição */}
      {hasChanges && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Você tem alterações não salvas</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetChanges}>
              <RotateCcw className="mr-2 size-4" />
              Desfazer
            </Button>
            <Button size="sm" onClick={saveAllChanges}>
              <Save className="mr-2 size-4" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}

      {/* Tabela Editável */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Data/Hora</TableHead>
              <TableHead>Temperatura (°C)</TableHead>
              <TableHead>Pressão (kPa)</TableHead>
              <TableHead>Umidade (%)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Carregando dados...
                </TableCell>
              </TableRow>
            ) : (
              filteredReadings.map((reading) => (
                <TableRow
                  key={reading.id}
                  className={reading.edited ? "bg-blue-50" : reading.generated ? "bg-green-50" : ""}
                >
                  <TableCell>{reading.timestamp}</TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-gray-50 relative"
                    onDoubleClick={() => handleCellDoubleClick(reading, "temperature")}
                  >
                    {editingCell?.id === reading.id && editingCell?.field === "temperature" ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleCellEdit}
                        onBlur={saveCellEdit}
                        className="h-8 w-20"
                        autoFocus
                      />
                    ) : (
                      <span className={reading.edited ? "font-medium text-blue-600" : ""}>
                        {reading.temperature.toFixed(2)}
                        {reading.edited && <span className="ml-1 text-xs text-blue-500">*</span>}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-gray-50"
                    onDoubleClick={() => handleCellDoubleClick(reading, "pressure")}
                  >
                    {editingCell?.id === reading.id && editingCell?.field === "pressure" ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleCellEdit}
                        onBlur={saveCellEdit}
                        className="h-8 w-20"
                        autoFocus
                      />
                    ) : (
                      <span className={reading.edited ? "font-medium text-blue-600" : ""}>
                        {reading.pressure.toFixed(2)}
                        {reading.edited && <span className="ml-1 text-xs text-blue-500">*</span>}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-gray-50"
                    onDoubleClick={() => handleCellDoubleClick(reading, "humidity")}
                  >
                    {editingCell?.id === reading.id && editingCell?.field === "humidity" ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleCellEdit}
                        onBlur={saveCellEdit}
                        className="h-8 w-20"
                        autoFocus
                      />
                    ) : (
                      <span className={reading.edited ? "font-medium text-blue-600" : ""}>
                        {reading.humidity.toFixed(1)}
                        {reading.edited && <span className="ml-1 text-xs text-blue-500">*</span>}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={getStatusColor(reading.status)}>
                    {reading.status === "normal" && "Normal"}
                    {reading.status === "warning" && "Atenção"}
                    {reading.status === "critical" && "Crítico"}
                  </TableCell>
                  <TableCell>
                    {reading.generated ? (
                      <span className="text-xs text-green-600 font-medium">Gerado</span>
                    ) : reading.edited ? (
                      <span className="text-xs text-blue-600 font-medium">Editado</span>
                    ) : (
                      <span className="text-xs text-gray-500">Original</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredReadings.length} de {readings.length} registros
          {(tempFilter.min || tempFilter.max) && " (filtrados)"}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <div className="text-sm">
            Página {page} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Próxima
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
