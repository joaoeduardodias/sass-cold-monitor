'use client'

import { Fan, Power, RotateCcw, Save, Snowflake } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

const DIFFERENTIAL_MIN = 0.5
const DIFFERENTIAL_MAX = 3
const DIFFERENTIAL_VISUAL_RANGE = 1

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface InstrumentControlsProps {
  id: string
  minValue: number
  maxValue: number
  setpoint: number
  differential: number
  defrost: boolean
  fan: boolean
  showFanControl?: boolean
  onToggleDefrost: (checked: boolean) => Promise<void>
  onToggleFan: (checked: boolean) => Promise<void>
  onSaveSettings: (settings: {
    setpoint: number
    differential: number
  }) => Promise<void>
}

export function InstrumentControls({
  id,
  minValue,
  maxValue,
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
    setLocalSetpoint(clampValue(value[0], minValue, maxValue))
    setChanged(true)
  }

  const handleDifferentialChange = (value: number[]) => {
    setLocalDifferential(
      clampValue(value[0], DIFFERENTIAL_MIN, DIFFERENTIAL_MAX),
    )
    setChanged(true)
  }

  const handleDefrostChange = async (checked: boolean) => {
    setSendingDefrost(true)

    try {
      await onToggleDefrost(checked)
      toast.info(`Degelo ${checked ? 'ativado' : 'desativado'}`)
    } catch {
      toast.error('Falha ao enviar comando de degelo')
    } finally {
      setSendingDefrost(false)
    }
  }

  const handleFanChange = async (checked: boolean) => {
    setSendingFan(true)

    try {
      await onToggleFan(checked)
      toast.info(`Ventilador ${checked ? 'ativado' : 'desativado'}`)
    } catch {
      toast.error('Falha ao enviar comando do ventilador')
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
      toast.success('Comandos de setpoint e diferencial enviados')
      setChanged(false)
    } catch {
      toast.error('Falha ao enviar comandos de setpoint/diferencial')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setLocalSetpoint(setpoint)
    setLocalDifferential(differential)
    setChanged(false)
  }

  const differentialSliderRange = useMemo(() => {
    const halfRange = DIFFERENTIAL_VISUAL_RANGE / 2

    return {
      min: localDifferential - halfRange,
      max: localDifferential + halfRange,
    }
  }, [localDifferential])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-linear-to-br from-blue-50 to-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${defrost ? 'bg-blue-100' : 'bg-gray-100'}`}
              >
                <Snowflake
                  className={`h-6 w-6 ${defrost ? 'text-blue-600' : 'text-gray-400'}`}
                />
              </div>
              <div>
                <h3 className="font-medium">Degelo</h3>
                <p className="text-muted-foreground text-sm">
                  Sistema de degelo
                </p>
              </div>
            </div>
            <Switch
              checked={defrost}
              disabled={sendingDefrost}
              onCheckedChange={handleDefrostChange}
            />
          </div>
        </Card>

        {showFanControl && (
          <Card className="border-0 bg-linear-to-br from-blue-50 to-white p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-2 ${fan ? 'bg-blue-100' : 'bg-gray-100'}`}
                >
                  <Fan
                    className={`h-6 w-6 ${fan ? 'text-blue-600' : 'text-gray-400'} ${fan ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '3s' }}
                  />
                </div>
                <div>
                  <h3 className="font-medium">Ventilador</h3>
                  <p className="text-muted-foreground text-sm">
                    Circulação de ar
                  </p>
                </div>
              </div>
              <Switch
                checked={fan}
                disabled={sendingFan}
                onCheckedChange={handleFanChange}
              />
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
                    setLocalSetpoint(clampValue(value, minValue, maxValue))
                    setChanged(true)
                  }
                }}
                className="h-8"
                step={0.5}
                min={minValue}
                max={maxValue}
              />
            </div>
          </div>
          <Slider
            id="setpoint"
            min={minValue}
            max={maxValue}
            step={0.5}
            value={[localSetpoint]}
            onValueChange={handleSetpointChange}
            className="py-4"
          />
          <p className="text-muted-foreground text-xs">
            Temperatura alvo para a câmara fria
          </p>
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
                  if (!Number.isNaN(value)) {
                    setLocalDifferential(
                      clampValue(value, DIFFERENTIAL_MIN, DIFFERENTIAL_MAX),
                    )
                    setChanged(true)
                  }
                }}
                className="h-8"
                step={0.5}
                min={DIFFERENTIAL_MIN}
                max={DIFFERENTIAL_MAX}
              />
            </div>
          </div>
          <Slider
            id="differential"
            min={differentialSliderRange.min}
            max={differentialSliderRange.max}
            step={0.5}
            value={[localDifferential]}
            onValueChange={handleDifferentialChange}
            className="py-4"
          />
          <p className="text-muted-foreground text-xs">
            Margem de operação (histerese)
          </p>
        </div>
      </div>

      <div className="rounded-md bg-blue-50 p-3">
        <h4 className="mb-1 font-medium text-blue-700">Faixa de Operação</h4>
        <div className="flex justify-between text-sm">
          <span>Liga: {(localSetpoint + localDifferential).toFixed(1)}°C</span>
          <span>
            Desliga: {(localSetpoint - localDifferential).toFixed(1)}°C
          </span>
        </div>
        <div className="relative mt-2 h-2 rounded-full bg-blue-100">
          <div
            className="absolute h-2 rounded-full bg-blue-500"
            style={{
              left: `${((localSetpoint - minValue) / (maxValue - minValue)) * 100}%`,
              right: `${100 - ((localSetpoint + localDifferential - minValue) / (maxValue - minValue)) * 100}%`,
            }}
          />
        </div>
        <div className="text-muted-foreground mt-1 flex justify-between text-xs">
          <span>{minValue}°C</span>
          <span>{maxValue}°C</span>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={loading || !changed}
        >
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
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Comandos enviados para o agente coletor da organização. Instrumento:{' '}
        {id}
      </p>
    </div>
  )
}
