"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Fan, Power, RotateCcw, Save, Snowflake } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface InstrumentControlsProps {
  id: string
  setpoint: number
  differential: number
  defrost: boolean
  fan: boolean
  showFanControl?: boolean
  onToggleDefrost: (checked: boolean) => Promise<void>
  onToggleFan: (checked: boolean) => Promise<void>
  onSaveSettings: (settings: { setpoint: number; differential: number }) => Promise<void>
}

export function InstrumentControls({
  id,
  setpoint,
  differential,
  defrost,
  fan,
  showFanControl = true,
  onToggleDefrost,
  onToggleFan,
  onSaveSettings,
}: InstrumentControlsProps) {
  const [localSetpoint, setLocalSetpoint] = useState(setpoint)
  const [localDifferential, setLocalDifferential] = useState(differential)
  const [changed, setChanged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendingDefrost, setSendingDefrost] = useState(false)
  const [sendingFan, setSendingFan] = useState(false)

  useEffect(() => {
    setLocalSetpoint(setpoint)
  }, [setpoint])

  useEffect(() => {
    setLocalDifferential(differential)
  }, [differential])

  const handleSetpointChange = (value: number[]) => {
    setLocalSetpoint(value[0])
    setChanged(true)
  }

  const handleDifferentialChange = (value: number[]) => {
    setLocalDifferential(value[0])
    setChanged(true)
  }

  const handleDefrostChange = async (checked: boolean) => {
    setSendingDefrost(true)

    try {
      await onToggleDefrost(checked)
      toast.info(`Degelo ${checked ? "ativado" : "desativado"}`)
    } catch {
      toast.error("Falha ao enviar comando de degelo")
    } finally {
      setSendingDefrost(false)
    }
  }

  const handleFanChange = async (checked: boolean) => {
    setSendingFan(true)

    try {
      await onToggleFan(checked)
      toast.info(`Ventilador ${checked ? "ativado" : "desativado"}`)
    } catch {
      toast.error("Falha ao enviar comando do ventilador")
    } finally {
      setSendingFan(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      await onSaveSettings({
        setpoint: localSetpoint,
        differential: localDifferential,
      })
      toast.success("Comandos de setpoint e diferencial enviados")
      setChanged(false)
    } catch {
      toast.error("Falha ao enviar comandos de setpoint/diferencial")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setLocalSetpoint(setpoint)
    setLocalDifferential(differential)
    setChanged(false)
  }

  return (
    <div className="space-y-6">
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
            <Switch checked={defrost} disabled={sendingDefrost} onCheckedChange={handleDefrostChange} />
          </div>
        </Card>

        {showFanControl && (
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
              <Switch checked={fan} disabled={sendingFan} onCheckedChange={handleFanChange} />
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="setpoint" className="text-base font-medium">
              Setpoint: {localSetpoint}°C
            </Label>
            <div className="w-16">
              <Input
                id="setpoint-input"
                type="number"
                value={localSetpoint}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value)
                  if (!Number.isNaN(value)) {
                    setLocalSetpoint(value)
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
            value={[localSetpoint]}
            onValueChange={handleSetpointChange}
            className="py-4"
          />
          <p className="text-xs text-muted-foreground">Temperatura alvo para a câmara fria</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="differential" className="text-base font-medium">
              Diferencial: {localDifferential}°C
            </Label>
            <div className="w-16">
              <Input
                id="differential-input"
                type="number"
                value={localDifferential}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value)
                  if (!Number.isNaN(value) && value >= 0.5 && value <= 5) {
                    setLocalDifferential(value)
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
            value={[localDifferential]}
            onValueChange={handleDifferentialChange}
            className="py-4"
          />
          <p className="text-xs text-muted-foreground">Margem de operação (histerese)</p>
        </div>
      </div>

      <div className="rounded-md bg-blue-50 p-3">
        <h4 className="font-medium text-blue-700 mb-1">Faixa de Operação</h4>
        <div className="flex justify-between text-sm">
          <span>Liga: {(localSetpoint + localDifferential).toFixed(1)}°C</span>
          <span>Desliga: {localSetpoint.toFixed(1)}°C</span>
        </div>
        <div className="mt-2 h-2 bg-blue-100 rounded-full relative">
          <div
            className="absolute h-2 bg-blue-500 rounded-full"
            style={{
              left: `${((localSetpoint - -25) / 15) * 100}%`,
              right: `${100 - ((localSetpoint + localDifferential - -25) / 15) * 100}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>-25°C</span>
          <span>-10°C</span>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={handleReset} disabled={loading || !changed}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar
        </Button>
        <div className="space-x-2">
          <Button variant="outline" disabled>
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

      <p className="text-xs text-muted-foreground">
        Comandos enviados para o agente coletor da organização. Instrumento: {id}
      </p>
    </div>
  )
}
