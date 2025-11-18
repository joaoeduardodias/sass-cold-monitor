"use client"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, Clock, Fan, Power, RotateCcw, Save, Snowflake } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type OperationalStatus = "refrigerating" | "defrosting" | "idle" | "alarm" | "fan-only" | "off"

interface InstrumentControlsProps {
  id: string
  initialSetpoint: number
  initialDifferential: number
  initialDefrost: boolean
  initialFan: boolean
  operationalStatus?: OperationalStatus
}

export function InstrumentControls({
  id,
  initialSetpoint,
  initialDifferential,
  initialDefrost,
  initialFan,
}: InstrumentControlsProps) {
  const [setpoint, setSetpoint] = useState(initialSetpoint)
  const [differential, setDifferential] = useState(initialDifferential)
  const [defrost, setDefrost] = useState(initialDefrost)
  const [fan, setFan] = useState(initialFan)
  const [loading, setLoading] = useState(false)
  const [changed, setChanged] = useState(false)

  const handleSetpointChange = (value: number[]) => {
    setSetpoint(value[0])
    setChanged(true)
  }

  const handleDifferentialChange = (value: number[]) => {
    setDifferential(value[0])
    setChanged(true)
  }

  const handleDefrostChange = (checked: boolean) => {
    setDefrost(checked)
    setChanged(true)

    // Feedback imediato para o usuário
    toast.info(`Degelo ${checked ? "ativado" : "desativado"}`, {
      description: `O sistema de degelo foi ${checked ? "ligado" : "desligado"}.`,
    })
  }

  const handleFanChange = (checked: boolean) => {
    setFan(checked)
    setChanged(true)

    // Feedback imediato para o usuário
    toast.info(`Ventilador ${checked ? "ativado" : "desativado"}`, {
      description: `O ventilador foi ${checked ? "ligado" : "desligado"}.`,
    })
  }

  const handleSave = async () => {
    setLoading(true)

    // Simulando uma chamada de API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.success("Configurações salvas com sucesso", {
      description: `Câmara ${id}: Setpoint: ${setpoint}°C, Diferencial: ${differential}°C`,
    })

    setLoading(false)
    setChanged(false)
  }

  const handleReset = () => {
    setSetpoint(initialSetpoint)
    setDifferential(initialDifferential)
    setDefrost(initialDefrost)
    setFan(initialFan)
    setChanged(false)

    toast.info("Configurações restauradas", {
      description: "Os valores foram restaurados para as configurações originais.",
    })
  }


  const getOperationalStatusBadge = (status: OperationalStatus) => {
    switch (status) {
      case "refrigerating":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Snowflake className="h-3 w-3" />
            <span>Refrigeração</span>
          </Badge>
        )
      case "defrosting":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
            <Snowflake className="h-3 w-3" />
            <span>Degelo</span>
          </Badge>
        )
      case "fan-only":
        return (
          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center gap-1">
            <Fan className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Ventilação</span>
          </Badge>
        )
      case "idle":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Standby</span>
          </Badge>
        )
      case "alarm":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 animate-pulse"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Alarme</span>
          </Badge>
        )
      case "off":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            <Power className="h-3 w-3" />
            <span>Desligado</span>
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Controles de Liga/Desliga */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4 border-0 shadow-md bg-linear-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${defrost ? "bg-blue-100" : "bg-gray-100"}`}>
                <Snowflake className={`h-6 w-6 ${defrost ? "text-blue-600" : "text-gray-400"}`} />
              </div>
              <div>
                <h3 className="font-medium">Degelo</h3>
                <p className="text-sm text-muted-foreground">Sistema de degelo</p>
              </div>
            </div>
            <Switch checked={defrost} onCheckedChange={handleDefrostChange} />
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-md bg-linear-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${fan ? "bg-blue-100" : "bg-gray-100"}`}>
                <Fan
                  className={`h-6 w-6 ${fan ? "text-blue-600" : "text-gray-400"} ${fan ? "animate-spin" : ""}`}
                  style={{ animationDuration: "3s" }}
                />
              </div>
              <div>
                <h3 className="font-medium">Ventilador</h3>
                <p className="text-sm text-muted-foreground">Circulação de ar</p>
              </div>
            </div>
            <Switch checked={fan} onCheckedChange={handleFanChange} />
          </div>
        </Card>
      </div>

      {/* Controles de Temperatura */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="setpoint" className="text-base font-medium">
              Setpoint: {setpoint}°C
            </Label>
            <div className="w-16">
              <Input
                id="setpoint-input"
                type="number"
                value={setpoint}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value)
                  if (!isNaN(value)) {
                    setSetpoint(value)
                    setChanged(true)
                  }
                }}
                className="h-8"
                step={0.5}
              />
            </div>
          </div>
          <Slider
            id="setpoint"
            min={-25}
            max={-10}
            step={0.5}
            value={[setpoint]}
            onValueChange={handleSetpointChange}
            className="py-4"
          />
          <p className="text-xs text-muted-foreground">Temperatura alvo para a câmara fria</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="differential" className="text-base font-medium">
              Diferencial: {differential}°C
            </Label>
            <div className="w-16">
              <Input
                id="differential-input"
                type="number"
                value={differential}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value)
                  if (!isNaN(value) && value >= 0.5 && value <= 5) {
                    setDifferential(value)
                    setChanged(true)
                  }
                }}
                className="h-8"
                step={0.5}
                min={0.5}
                max={5}
              />
            </div>
          </div>
          <Slider
            id="differential"
            min={0.5}
            max={5}
            step={0.5}
            value={[differential]}
            onValueChange={handleDifferentialChange}
            className="py-4"
          />
          <p className="text-xs text-muted-foreground">Margem de operação (histerese)</p>
        </div>
      </div>

      {/* Faixa de Operação Calculada */}
      <div className="rounded-md bg-blue-50 p-3">
        <h4 className="font-medium text-blue-700 mb-1">Faixa de Operação</h4>
        <div className="flex justify-between text-sm">
          <span>Liga: {(setpoint + differential).toFixed(1)}°C</span>
          <span>Desliga: {setpoint.toFixed(1)}°C</span>
        </div>
        <div className="mt-2 h-2 bg-blue-100 rounded-full relative">
          <div
            className="absolute h-2 bg-blue-500 rounded-full"
            style={{
              left: `${((setpoint - -25) / (-10 - -25)) * 100}%`,
              right: `${100 - ((setpoint + differential - -25) / (-10 - -25)) * 100}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>-25°C</span>
          <span>-10°C</span>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={handleReset} disabled={loading || !changed}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar
        </Button>
        <div className="space-x-2">
          <Button variant="outline" disabled={loading}>
            <Power className="mr-2 h-4 w-4" />
            Forçar
          </Button>
          <Button onClick={handleSave} disabled={loading || !changed}>
            {loading ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
