"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateInstrumentData } from "@/http/instruments/generate-instrument-data"
import { getInstrumentData, type InstrumentDataPoint } from "@/http/instruments/get-instrument-data"
import { updateInstrumentData } from "@/http/instruments/update-instrument-data"
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Edit,
  Printer,
  RotateCcw,
  Save,
  Search,
  Settings,
  TrendingUp,
  Zap,
} from "lucide-react"
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation"
import { Fragment, startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

type MetricField = "temperature" | "pressure"

type Reading = {
  id: string
  timestamp: string
  timestampIso: string
  timestampMs: number
  compactTimestamp: string
  temperature: number | null
  pressure: number | null
  status: "normal" | "warning" | "critical"
  originalTemperature?: number | null
  originalPressure?: number | null
  temperaturePointId: string | null
  pressurePointId: string | null
  temperatureUpdatedUserAt: string | null
  pressureUpdatedUserAt: string | null
}

type ChartData = {
  timestampIso: string
  timestampMs: number
  tickLabel: string
  tooltipLabel: string
  temperature: number | null
  pressure: number | null
}

type ChartConfig = {
  limitValue: string
  tempVariation: string
  minValue: string
  maxValue: string
}

type DataGenerationConfig = {
  startDate: string
  endDate: string
  defrostDate: string
  variation: string
  initialValue: string
  averageValue: string
}

interface HistoryTableProps {
  id: string
  initialNowIso: string
  instrumentName: string
  orgSlug: string
  instrumentSlug: string
  instrumentType: "TEMPERATURE" | "PRESSURE"
  minValue: number
  maxValue: number
}

const itemsPerPage = 36
const compactRowCount = 6
const defaultChartConfig: ChartConfig = {
  limitValue: "",
  tempVariation: "1",
  minValue: "",
  maxValue: "",
}
const compactTimestampFormatter = new Intl.DateTimeFormat([], {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})
const chartTickFormatter = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
})
const chartTooltipFormatter = new Intl.DateTimeFormat([], {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

type HistoryUrlState = {
  page: number
  startDate: string
  endDate: string
  chartInterval: string
  tableInterval: string
  valueFilter: { min: string; max: string }
  chartConfig: ChartConfig
}

function toDateTimeInputValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

function roundToSingleDecimal(value: number) {
  return Number(value.toFixed(1))
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function addHoursToDateTimeInputValue(value: string, hours: number) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return toDateTimeInputValue(new Date(date.getTime() + hours * 60 * 60 * 1000))
}

function formatCompactTimestamp(timestampIso: string) {
  return compactTimestampFormatter.format(new Date(timestampIso)).replace(",", " -")
}

function formatChartTick(timestampIso: string) {
  return chartTickFormatter.format(new Date(timestampIso))
}

function formatChartTooltipLabel(timestampIso: string) {
  return chartTooltipFormatter.format(new Date(timestampIso)).replace(",", "")
}

function getStatusColor(status: string) {
  switch (status) {
    case "normal":
      return "text-emerald-700"
    case "warning":
      return "text-amber-700"
    case "critical":
      return "text-red-700"
    default:
      return ""
  }
}

export function HistoryTable({
  id,
  initialNowIso,
  instrumentName,
  orgSlug,
  instrumentSlug,
  instrumentType,
  minValue,
  maxValue,
}: HistoryTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const baseNow = useMemo(() => new Date(initialNowIso), [initialNowIso])
  const defaultStartDate = useMemo(
    () => toDateTimeInputValue(new Date(baseNow.getTime() - 24 * 60 * 60 * 1000)),
    [baseNow],
  )
  const defaultEndDate = useMemo(() => toDateTimeInputValue(baseNow), [baseNow])
  const defaultHistoryUrlState = useMemo<HistoryUrlState>(
    () => ({
      page: 1,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      chartInterval: "30",
      tableInterval: "10",
      valueFilter: { min: "", max: "" },
      chartConfig: defaultChartConfig,
    }),
    [defaultEndDate, defaultStartDate],
  )

  const getHistoryUrlState = useCallback(
    (params: URLSearchParams | ReadonlyURLSearchParams): HistoryUrlState => ({
      page: parsePositiveInteger(params.get("historyPage"), defaultHistoryUrlState.page),
      startDate: params.get("historyStart") ?? defaultHistoryUrlState.startDate,
      endDate: params.get("historyEnd") ?? defaultHistoryUrlState.endDate,
      chartInterval: params.get("historyChartInterval") ?? defaultHistoryUrlState.chartInterval,
      tableInterval: params.get("historyTableInterval") ?? defaultHistoryUrlState.tableInterval,
      valueFilter: {
        min: params.get("historyValueMin") ?? defaultHistoryUrlState.valueFilter.min,
        max: params.get("historyValueMax") ?? defaultHistoryUrlState.valueFilter.max,
      },
      chartConfig: {
        limitValue: params.get("historyLimitValue") ?? defaultHistoryUrlState.chartConfig.limitValue,
        tempVariation: params.get("historyTempVariation") ?? defaultHistoryUrlState.chartConfig.tempVariation,
        minValue: params.get("historyChartMin") ?? defaultHistoryUrlState.chartConfig.minValue,
        maxValue: params.get("historyChartMax") ?? defaultHistoryUrlState.chartConfig.maxValue,
      },
    }),
    [defaultHistoryUrlState],
  )

  const initialHistoryUrlState = useMemo(
    () => getHistoryUrlState(searchParams),
    [getHistoryUrlState, searchParams],
  )

  const [allReadings, setAllReadings] = useState<Reading[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [page, setPage] = useState(initialHistoryUrlState.page)
  const [loading, setLoading] = useState(true)
  const [generatedAt, setGeneratedAt] = useState("")
  const [editingCell, setEditingCell] = useState<{ id: string; field: MetricField } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [pendingEdits, setPendingEdits] = useState<Record<string, number>>({})
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [isDialogReady, setIsDialogReady] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const [startDate, setStartDate] = useState(initialHistoryUrlState.startDate)
  const [endDate, setEndDate] = useState(initialHistoryUrlState.endDate)
  const [chartInterval, setChartInterval] = useState(initialHistoryUrlState.chartInterval)
  const [tableInterval, setTableInterval] = useState(initialHistoryUrlState.tableInterval)
  const [valueFilter, setValueFilter] = useState(initialHistoryUrlState.valueFilter)

  const [chartConfig, setChartConfig] = useState<ChartConfig>(initialHistoryUrlState.chartConfig)
  const [dataGenConfig, setDataGenConfig] = useState<DataGenerationConfig>(() => ({
    startDate: toDateTimeInputValue(new Date(baseNow.getTime() - 7 * 24 * 60 * 60 * 1000)),
    endDate: toDateTimeInputValue(new Date(baseNow.getTime() - 6 * 24 * 60 * 60 * 1000)),
    defrostDate: toDateTimeInputValue(new Date(baseNow.getTime() - 6.5 * 24 * 60 * 60 * 1000)),
    variation: instrumentType === "PRESSURE" ? "0.5" : "2",
    initialValue: "",
    averageValue: "",
  }))

  const primaryMetricLabel = instrumentType === "PRESSURE" ? "Pressao" : "Temperatura"
  const primaryMetricUnit = instrumentType === "PRESSURE" ? "Bar" : "°C"
  const hasChanges = Object.keys(pendingEdits).length > 0
  const deferredValueFilter = useDeferredValue(valueFilter)
  const deferredChartConfig = useDeferredValue(chartConfig)

  const getReadingStatus = useCallback((temperature: number | null, pressure: number | null): Reading["status"] => {
    const value = temperature ?? pressure

    if (value === null) return "normal"
    if (value > maxValue || value < minValue) return "critical"

    const range = maxValue - minValue
    const warningThreshold = range > 0 ? range * 0.2 : Math.abs(maxValue || value) * 0.2

    if (value >= maxValue - warningThreshold || value <= minValue + warningThreshold) {
      return "warning"
    }

    return "normal"
  }, [maxValue, minValue])

  const formatNumber = (value: number | null | undefined, digits: number) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "--"
    return value.toFixed(digits)
  }

  const applyChartInterval = useCallback((points: ChartData[]) => {
    const intervalMinutes = Number.parseInt(chartInterval, 10)

    if (!intervalMinutes || points.length < 2) {
      return points
    }

    let lastIncludedAt = 0

    return points.filter((point, index) => {
      const currentTime = point.timestampMs
      if (index === 0 || currentTime - lastIncludedAt >= intervalMinutes * 60_000) {
        lastIncludedAt = currentTime
        return true
      }

      return false
    })
  }, [chartInterval])

  const mapMergedData = useCallback((
    temperatureData: InstrumentDataPoint[],
    pressureData: InstrumentDataPoint[],
  ) => {
    const merged = new Map<string, Reading>()

    for (const point of temperatureData) {
      const existing = merged.get(point.createdAt)
      const timestampMs = existing?.timestampMs ?? new Date(point.createdAt).getTime()
      merged.set(point.createdAt, {
        id: existing?.id ?? point.id,
        timestamp: existing?.timestamp ?? new Date(point.createdAt).toLocaleString(),
        timestampIso: point.createdAt,
        timestampMs,
        compactTimestamp: existing?.compactTimestamp ?? formatCompactTimestamp(point.createdAt),
        temperature: point.data,
        pressure: existing?.pressure ?? null,
        status: getReadingStatus(point.data, existing?.pressure ?? null),
        originalTemperature: existing?.originalTemperature,
        originalPressure: existing?.originalPressure,
        temperaturePointId: point.id,
        pressurePointId: existing?.pressurePointId ?? null,
        temperatureUpdatedUserAt: point.updatedUserAt,
        pressureUpdatedUserAt: existing?.pressureUpdatedUserAt ?? null,
      })
    }

    for (const point of pressureData) {
      const existing = merged.get(point.createdAt)
      const nextTemperature = existing?.temperature ?? null
      const timestampMs = existing?.timestampMs ?? new Date(point.createdAt).getTime()

      merged.set(point.createdAt, {
        id: existing?.id ?? point.id,
        timestamp: existing?.timestamp ?? new Date(point.createdAt).toLocaleString(),
        timestampIso: point.createdAt,
        timestampMs,
        compactTimestamp: existing?.compactTimestamp ?? formatCompactTimestamp(point.createdAt),
        temperature: nextTemperature,
        pressure: point.data,
        status: getReadingStatus(nextTemperature, point.data),
        originalTemperature: existing?.originalTemperature,
        originalPressure: existing?.originalPressure,
        temperaturePointId: existing?.temperaturePointId ?? null,
        pressurePointId: point.id,
        temperatureUpdatedUserAt: existing?.temperatureUpdatedUserAt ?? null,
        pressureUpdatedUserAt: point.updatedUserAt,
      })
    }

    const sortedReadings = Array.from(merged.values()).sort((a, b) => a.timestampMs - b.timestampMs)
    const readings = sortedReadings.map((reading) => ({
      ...reading,
      id: reading.temperaturePointId ?? reading.pressurePointId ?? reading.id,
    }))
    const chartPoints = sortedReadings.map((reading) => ({
      timestampIso: reading.timestampIso,
      timestampMs: reading.timestampMs,
      tickLabel: formatChartTick(reading.timestampIso),
      tooltipLabel: formatChartTooltipLabel(reading.timestampIso),
      temperature: reading.temperature,
      pressure: reading.pressure,
    }))

    return {
      readings,
      chartPoints,
    }
  }, [getReadingStatus])

  const isFieldEdited = (reading: Reading, field: MetricField) => {
    const pointId = field === "temperature" ? reading.temperaturePointId : reading.pressurePointId
    return pointId ? pointId in pendingEdits : false
  }

  const getFieldValue = (reading: Reading, field: MetricField) =>
    field === "temperature" ? reading.temperature : reading.pressure

  const loadData = useCallback(async () => {
    setLoading(true)

    try {
      const chartVariation = Math.max(1, Number.parseInt(chartInterval, 10))
      const tableVariation = Number.parseInt(tableInterval, 10)

      const { data } = await getInstrumentData({
        orgSlug,
        instrumentSlug,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        chartVariation,
        tableVariation,
      })

      const merged = mapMergedData(data.tableDataTemperature, data.tableDataPressure)
      const chartMerged = mapMergedData(data.chartDataTemperature, data.chartDataPressure)

      setAllReadings(merged.readings)
      setChartData(applyChartInterval(chartMerged.chartPoints))
      setPendingEdits({})
    } catch {
      toast.error("Falha ao carregar dados do historico")
      setChartData([])
      setAllReadings([])
    } finally {
      setLoading(false)
    }
  }, [applyChartInterval, chartInterval, endDate, instrumentSlug, mapMergedData, orgSlug, startDate, tableInterval])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setGeneratedAt(new Date().toLocaleString())
  }, [])

  useEffect(() => {
    setIsDialogReady(true)
  }, [])

  const filteredReadings = useMemo(() => {
    const minFilter = deferredValueFilter.min
      ? Number.parseFloat(deferredValueFilter.min)
      : Number.NEGATIVE_INFINITY
    const maxFilter = deferredValueFilter.max
      ? Number.parseFloat(deferredValueFilter.max)
      : Number.POSITIVE_INFINITY

    return allReadings.filter((reading) => {
      const value =
        instrumentType === "PRESSURE"
          ? reading.pressure ?? reading.temperature
          : reading.temperature ?? reading.pressure

      if (value === null) return false

      return value >= minFilter && value <= maxFilter
    })
  }, [allReadings, deferredValueFilter.max, deferredValueFilter.min, instrumentType])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredReadings.length / itemsPerPage)),
    [filteredReadings.length]
  )

  const paginatedReadings = useMemo(
    () => filteredReadings.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredReadings, page]
  )
  const compactColumnCount = useMemo(
    () => Math.max(6, Math.ceil(paginatedReadings.length / compactRowCount)),
    [paginatedReadings.length]
  )

  useEffect(() => {
    const urlState = getHistoryUrlState(searchParams)

    setPage((current) => (current !== urlState.page ? urlState.page : current))
    setStartDate((current) => (current !== urlState.startDate ? urlState.startDate : current))
    setEndDate((current) => (current !== urlState.endDate ? urlState.endDate : current))
    setChartInterval((current) => (current !== urlState.chartInterval ? urlState.chartInterval : current))
    setTableInterval((current) => (current !== urlState.tableInterval ? urlState.tableInterval : current))
    setValueFilter((current) =>
      current.min !== urlState.valueFilter.min || current.max !== urlState.valueFilter.max
        ? urlState.valueFilter
        : current,
    )
    setChartConfig((current) =>
      current.limitValue !== urlState.chartConfig.limitValue
        || current.tempVariation !== urlState.chartConfig.tempVariation
        || current.minValue !== urlState.chartConfig.minValue
        || current.maxValue !== urlState.chartConfig.maxValue
        ? urlState.chartConfig
        : current,
    )
  }, [getHistoryUrlState, searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    params.set("historyPage", String(page))
    params.set("historyStart", startDate)
    params.set("historyEnd", endDate)
    params.set("historyChartInterval", chartInterval)
    params.set("historyTableInterval", tableInterval)

    if (deferredValueFilter.min) params.set("historyValueMin", deferredValueFilter.min)
    else params.delete("historyValueMin")

    if (deferredValueFilter.max) params.set("historyValueMax", deferredValueFilter.max)
    else params.delete("historyValueMax")

    if (deferredChartConfig.limitValue) params.set("historyLimitValue", deferredChartConfig.limitValue)
    else params.delete("historyLimitValue")

    if (deferredChartConfig.tempVariation !== defaultHistoryUrlState.chartConfig.tempVariation) {
      params.set("historyTempVariation", deferredChartConfig.tempVariation)
    } else {
      params.delete("historyTempVariation")
    }

    if (deferredChartConfig.minValue) params.set("historyChartMin", deferredChartConfig.minValue)
    else params.delete("historyChartMin")

    if (deferredChartConfig.maxValue) params.set("historyChartMax", deferredChartConfig.maxValue)
    else params.delete("historyChartMax")

    const nextQuery = params.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery !== currentQuery) {
      startTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
      })
    }
  }, [
    chartInterval,
    defaultHistoryUrlState.chartConfig.tempVariation,
    deferredChartConfig.limitValue,
    deferredChartConfig.maxValue,
    deferredChartConfig.minValue,
    deferredChartConfig.tempVariation,
    deferredValueFilter.max,
    deferredValueFilter.min,
    endDate,
    page,
    pathname,
    router,
    searchParams,
    startDate,
    tableInterval,
  ])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handlePrint = () => {
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

    const styleElement = document.createElement("style")
    styleElement.innerHTML = printStyles
    document.head.appendChild(styleElement)

    window.print()

    setTimeout(() => {
      document.head.removeChild(styleElement)
    }, 1000)

    toast.success("Preparando impressao do historico")
  }

  const handleChartConfigChange = (field: keyof ChartConfig, value: string) => {
    setChartConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetChartConfig = () => {
    setChartConfig(defaultChartConfig)
  }

  const handleCellDoubleClick = (reading: Reading, field: MetricField) => {
    const currentValue = field === "temperature" ? reading.temperature : reading.pressure
    const pointId = field === "temperature" ? reading.temperaturePointId : reading.pressurePointId

    if (currentValue === null || pointId === null) {
      return
    }

    setEditingCell({ id: reading.id, field })
    setEditValue(currentValue.toFixed(1))
  }

  const handleCellEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveCellEdit()
    } else if (e.ctrlKey && e.key === "ArrowDown") {
      e.preventDefault()
      if (saveCellEdit({ silent: true })) {
        navigateToNextCell("down")
      }
    } else if (e.ctrlKey && e.key === "ArrowUp") {
      e.preventDefault()
      if (saveCellEdit({ silent: true })) {
        navigateToNextCell("up")
      }
    } else if (e.ctrlKey && e.key === "ArrowRight") {
      e.preventDefault()
      if (saveCellEdit({ silent: true })) {
        navigateToNextCell("right")
      }
    } else if (e.ctrlKey && e.key === "ArrowLeft") {
      e.preventDefault()
      if (saveCellEdit({ silent: true })) {
        navigateToNextCell("left")
      }
    } else if (e.key === "Escape") {
      cancelCellEdit()
    }
  }

  const cancelCellEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleStartDateChange = (nextStartDate: string) => {
    const nextSuggestedEndDate = addHoursToDateTimeInputValue(nextStartDate, 24)
    const previousSuggestedEndDate = addHoursToDateTimeInputValue(startDate, 24)

    setStartDate(nextStartDate)
    setEndDate((currentEndDate) => {
      if (!nextSuggestedEndDate) {
        return currentEndDate
      }

      if (!currentEndDate || currentEndDate === previousSuggestedEndDate) {
        return nextSuggestedEndDate
      }

      return currentEndDate
    })
  }

  const navigateToNextCell = (direction: "up" | "down" | "left" | "right") => {
    if (!editingCell || paginatedReadings.length === 0) return

    const currentIndex = paginatedReadings.findIndex((reading) => reading.id === editingCell.id)
    if (currentIndex === -1) return

    let nextReading: Reading | undefined

    if (direction === "up" || direction === "down") {
      const delta = direction === "down" ? 1 : -1
      const nextIndex = (currentIndex + delta + paginatedReadings.length) % paginatedReadings.length
      nextReading = paginatedReadings[nextIndex]
    } else {
      const rowIndex = currentIndex % compactRowCount
      const currentColumnIndex = Math.floor(currentIndex / compactRowCount)
      const columnDelta = direction === "right" ? 1 : -1

      for (let step = 1; step <= compactColumnCount; step += 1) {
        const nextColumnIndex = (currentColumnIndex + columnDelta * step + compactColumnCount) % compactColumnCount
        const candidate = paginatedReadings[nextColumnIndex * compactRowCount + rowIndex]
        if (candidate) {
          nextReading = candidate
          break
        }
      }
    }

    if (!nextReading) return

    const nextField: MetricField = instrumentType === "PRESSURE" ? "pressure" : "temperature"
    const nextValue = getFieldValue(nextReading, nextField)

    if (nextValue === null) return

    setEditingCell({ id: nextReading.id, field: nextField })
    setEditValue(nextValue.toFixed(1))
  }

  const saveCellEdit = ({ silent = false }: { silent?: boolean } = {}) => {
    if (!editingCell) return false

    const newValue = Number.parseFloat(editValue)
    if (Number.isNaN(newValue)) {
      toast.error("Valor invalido")
      return false
    }

    let editedPointId: string | null = null
    let didChange = false

    setAllReadings((prev) =>
      prev.map((reading) => {
        if (reading.id !== editingCell.id) {
          return reading
        }

        if (editingCell.field === "temperature" && reading.temperaturePointId) {
          const originalValue = reading.originalTemperature ?? reading.temperature
          const normalizedOriginalValue = originalValue === null ? null : roundToSingleDecimal(originalValue)
          const normalizedNewValue = roundToSingleDecimal(newValue)
          editedPointId = reading.temperaturePointId
          didChange = normalizedOriginalValue !== normalizedNewValue

          if (!didChange) {
            return {
              ...reading,
              temperature: originalValue,
              originalTemperature: undefined,
              status: getReadingStatus(originalValue, reading.pressure),
            }
          }

          return {
            ...reading,
            originalTemperature: originalValue,
            temperature: normalizedNewValue,
            status: getReadingStatus(normalizedNewValue, reading.pressure),
          }
        }

        if (editingCell.field === "pressure" && reading.pressurePointId) {
          const originalValue = reading.originalPressure ?? reading.pressure
          const normalizedOriginalValue = originalValue === null ? null : roundToSingleDecimal(originalValue)
          const normalizedNewValue = roundToSingleDecimal(newValue)
          editedPointId = reading.pressurePointId
          didChange = normalizedOriginalValue !== normalizedNewValue

          if (!didChange) {
            return {
              ...reading,
              pressure: originalValue,
              originalPressure: undefined,
              status: getReadingStatus(reading.temperature, originalValue),
            }
          }

          return {
            ...reading,
            originalPressure: originalValue,
            pressure: normalizedNewValue,
            status: getReadingStatus(reading.temperature, normalizedNewValue),
          }
        }

        return reading
      }),
    )

    if (editedPointId !== null) {
      const pointId = editedPointId
      setPendingEdits((prev) => {
        if (!didChange) {
          const { [pointId]: _removed, ...rest } = prev
          return rest
        }

        return {
          ...prev,
          [pointId]: roundToSingleDecimal(newValue),
        }
      })

      if (!silent && didChange) {
        toast.success("Valor alterado")
      }
    }

    cancelCellEdit()
    return true
  }

  const saveAllChanges = async () => {
    if (!hasChanges) return

    try {
      await updateInstrumentData({
        orgSlug,
        data: Object.entries(pendingEdits).map(([pointId, editData]) => ({
          id: pointId,
          editData,
        })),
      })

      toast.success("Alteracoes salvas com sucesso")
      await loadData()
    } catch {
      toast.error("Falha ao salvar alteracoes do historico")
    }
  }

  const resetChanges = () => {
    setAllReadings((prev) =>
      prev.map((reading) => ({
        ...reading,
        temperature: reading.originalTemperature ?? reading.temperature,
        pressure: reading.originalPressure ?? reading.pressure,
        originalTemperature: undefined,
        originalPressure: undefined,
        status: getReadingStatus(
          reading.originalTemperature ?? reading.temperature,
          reading.originalPressure ?? reading.pressure,
        ),
      })),
    )
    setPendingEdits({})
    cancelCellEdit()
    toast.info("Alteracoes desfeitas")
  }

  const generateDataPoints = async () => {
    const start = new Date(dataGenConfig.startDate)
    const end = new Date(dataGenConfig.endDate)
    const defrostDate = dataGenConfig.defrostDate ? new Date(dataGenConfig.defrostDate) : undefined
    const variation = Number.parseFloat(dataGenConfig.variation)
    const initialTemp = dataGenConfig.initialValue ? Number.parseFloat(dataGenConfig.initialValue) : undefined
    const averageTemp = dataGenConfig.averageValue ? Number.parseFloat(dataGenConfig.averageValue) : undefined

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Informe um periodo valido para gerar dados")
      return
    }

    if (start >= end) {
      toast.error("A data inicial precisa ser menor que a final")
      return
    }

    if (Number.isNaN(variation) || variation <= 0) {
      toast.error("Informe uma variacao valida")
      return
    }

    setIsGenerating(true)
    setGenerationProgress(15)

    try {
      const progressInterval = window.setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 10, 85))
      }, 200)

      const response = await generateInstrumentData({
        orgSlug,
        instrumentId: id,
        startDate: start,
        endDate: end,
        defrostDate: instrumentType === "TEMPERATURE" ? defrostDate : undefined,
        variation,
        initialTemp,
        averageTemp,
      })

      window.clearInterval(progressInterval)
      setGenerationProgress(100)
      setPage(1)
      setStartDate(toDateTimeInputValue(start))
      setEndDate(toDateTimeInputValue(end))
      toast.success(`${response.generatedData.length} dados gerados com sucesso`)
      setGenerateDialogOpen(false)
    } catch {
      toast.error("Falha ao gerar dados do historico")
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
      }, 300)
    }
  }

  const { hasTemperatureSeries, hasPressureSeries, yAxisScale } = useMemo(() => {
    const step = Math.max(1, Number.parseInt(deferredChartConfig.tempVariation, 10) || 1)
    const configuredMin = deferredChartConfig.minValue ? Number.parseFloat(deferredChartConfig.minValue) : undefined
    const configuredMax = deferredChartConfig.maxValue ? Number.parseFloat(deferredChartConfig.maxValue) : undefined
    let hasTemperature = false
    let hasPressure = false
    let maxAbsValue = 0

    for (const point of chartData) {
      if (point.temperature !== null) {
        hasTemperature = true
        maxAbsValue = Math.max(maxAbsValue, Math.abs(point.temperature))
      }
      if (point.pressure !== null) {
        hasPressure = true
        maxAbsValue = Math.max(maxAbsValue, Math.abs(point.pressure))
      }
    }

    if (configuredMin !== undefined && configuredMax !== undefined) {
      const minTick = Math.floor(configuredMin / step) * step
      const maxTick = Math.ceil(configuredMax / step) * step
      const ticks: number[] = []

      for (let tick = minTick; tick <= maxTick; tick += step) {
        ticks.push(Number(tick.toFixed(4)))
      }

      return {
        hasTemperatureSeries: hasTemperature,
        hasPressureSeries: hasPressure,
        yAxisScale: {
          domain: [configuredMin, configuredMax] as [number, number],
          ticks,
        },
      }
    }

    const symmetricLimit = Math.max(step * 5, Math.ceil(maxAbsValue / step) * step)
    const ticks: number[] = []

    for (let tick = -symmetricLimit; tick <= symmetricLimit; tick += step) {
      ticks.push(Number(tick.toFixed(4)))
    }

    return {
      hasTemperatureSeries: hasTemperature,
      hasPressureSeries: hasPressure,
      yAxisScale: {
        domain: [-symmetricLimit, symmetricLimit] as [number, number],
        ticks,
      },
    }
  }, [chartData, deferredChartConfig.maxValue, deferredChartConfig.minValue, deferredChartConfig.tempVariation])

  const formatYAxisTick = (value: number | string) => Number(value).toFixed(1)

  return (
    <div className="space-y-6">
      <div id="history-print-area" style={{ display: "none" }}>
        <div className="print-header">
          <h1>Historico de Leituras - {instrumentName}</h1>
          <p suppressHydrationWarning>Relatorio gerado em: {generatedAt || "--"}</p>
        </div>
        <div className="print-info">
          <p>
            <strong>Periodo:</strong> {startDate} a {endDate}
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
              <th>Pressao (kPa)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReadings.map((reading) => (
              <tr key={reading.id}>
                <td>{reading.timestamp}</td>
                <td>{formatNumber(reading.temperature, 1)}</td>
                <td>{formatNumber(reading.pressure, 1)}</td>
                <td>
                  {reading.status === "normal" && "Normal"}
                  {reading.status === "warning" && "Atencao"}
                  {reading.status === "critical" && "Critico"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        {isDialogReady ? (
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
                  Gerador de Dados Historicos
                </DialogTitle>
                <DialogDescription>Os dados serao persistidos usando a rota real da API.</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gen-start-date">Inicio</Label>
                    <Input
                      id="gen-start-date"
                      type="datetime-local"
                      value={dataGenConfig.startDate}
                      onChange={(e) => setDataGenConfig((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gen-end-date">Fim</Label>
                    <Input
                      id="gen-end-date"
                      type="datetime-local"
                      value={dataGenConfig.endDate}
                      onChange={(e) => setDataGenConfig((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  {instrumentType === "TEMPERATURE" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="gen-defrost-date">Horario de degelo (opcional)</Label>
                      <Input
                        id="gen-defrost-date"
                        type="datetime-local"
                        value={dataGenConfig.defrostDate}
                        onChange={(e) => setDataGenConfig((prev) => ({ ...prev, defrostDate: e.target.value }))}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="variation">Variacao</Label>
                    <Input
                      id="variation"
                      type="number"
                      step="0.1"
                      value={dataGenConfig.variation}
                      onChange={(e) => setDataGenConfig((prev) => ({ ...prev, variation: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initial-value">Valor inicial ({primaryMetricUnit})</Label>
                    <Input
                      id="initial-value"
                      type="number"
                      step="0.1"
                      value={dataGenConfig.initialValue}
                      onChange={(e) => setDataGenConfig((prev) => ({ ...prev, initialValue: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="average-value">Valor medio ({primaryMetricUnit})</Label>
                    <Input
                      id="average-value"
                      type="number"
                      step="0.1"
                      value={dataGenConfig.averageValue}
                      onChange={(e) => setDataGenConfig((prev) => ({ ...prev, averageValue: e.target.value }))}
                    />
                  </div>
                </div>

                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Gerando dados...</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} />
                  </div>
                )}

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
        ) : (
          <Button variant="outline" disabled>
            <Database className="mr-2 size-4" />
            Gerar Dados
          </Button>
        )}
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 size-4" />
          Imprimir Historico
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Data e Hora Inicial</Label>
          <Input id="start-date" type="datetime-local" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">Data e Hora Final</Label>
          <Input id="end-date" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="chart-interval">Intervalo do Grafico</Label>
          <Select value={chartInterval} onValueChange={setChartInterval}>
            <SelectTrigger id="chart-interval">
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
        <div className="space-y-2">
          <Label htmlFor="table-interval">Intervalo da Tabela</Label>
          <Select value={tableInterval} onValueChange={setTableInterval}>
            <SelectTrigger id="table-interval">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Configuracoes do Grafico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="limit-value">Linha de Limite ({primaryMetricUnit})</Label>
              <Input
                id="limit-value"
                type="number"
                placeholder="Ex: -10"
                value={chartConfig.limitValue}
                onChange={(e) => handleChartConfigChange("limitValue", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Exibe uma linha de referencia no eixo Y</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-variation">Variação Coluna Temperatura</Label>
              <Input
                id="temp-variation"
                type="number"
                step="1"
                min="1"
                max="10"
                value={chartConfig.tempVariation}
                onChange={(e) => handleChartConfigChange("tempVariation", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Define o passo entre os valores do eixo vertical do grafico</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-value">Valor Minimo ({primaryMetricUnit})</Label>
              <Input
                id="min-value"
                type="number"
                value={chartConfig.minValue}
                onChange={(e) => handleChartConfigChange("minValue", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Limite inferior do eixo Y</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-value">Valor Maximo ({primaryMetricUnit})</Label>
              <Input
                id="max-value"
                type="number"
                value={chartConfig.maxValue}
                onChange={(e) => handleChartConfigChange("maxValue", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Limite superior do eixo Y</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {chartConfig.limitValue && (
              <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs">
                Limite: {chartConfig.limitValue}
                {primaryMetricUnit}
              </div>
            )}
            {chartConfig.tempVariation !== "1" && (
              <div className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs">
                Variação eixo: {chartConfig.tempVariation}
              </div>
            )}
            {(chartConfig.minValue || chartConfig.maxValue) && (
              <div className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs">
                Range: {chartConfig.minValue || "auto"} a {chartConfig.maxValue || "auto"}
                {primaryMetricUnit}
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={resetChartConfig}>
              Restaurar configuracoes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Tendencia Historica
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">Carregando grafico...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestampIso"
                  interval={0}
                  minTickGap={0}
                  angle={-90}
                  textAnchor="end"
                  height={66}
                  tickMargin={10}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(_, index) => chartData[index]?.tickLabel ?? ""}
                />
                <YAxis
                  domain={yAxisScale.domain}
                  ticks={yAxisScale.ticks}
                  interval={0}
                  width={44}
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip
                  labelFormatter={(label, payload) => {
                    const firstPayload = payload[0] as { payload?: ChartData } | undefined
                    return firstPayload?.payload?.tooltipLabel ?? String(label)
                  }}
                  formatter={(value: number | string, name: string) => [
                    `${typeof value === "number" ? value.toFixed(2) : value}${name === "temperature" ? "°C" : " kPa"}`,
                    name === "temperature" ? "Temperatura" : "Pressao",
                  ]}
                />

                {chartConfig.limitValue && (
                  <ReferenceLine
                    y={Number.parseFloat(chartConfig.limitValue)}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ value: `Limite: ${chartConfig.limitValue}${primaryMetricUnit}`, position: "insideTopRight" }}
                  />
                )}

                {hasTemperatureSeries && (
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                    connectNulls
                  />
                )}
                {hasPressureSeries && (
                  <Line
                    type="monotone"
                    dataKey="pressure"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Filtro de {primaryMetricLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="value-min">Valor Minimo ({primaryMetricUnit})</Label>
              <Input
                id="value-min"
                type="number"
                value={valueFilter.min}
                onChange={(e) => setValueFilter((prev) => ({ ...prev, min: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value-max">Valor Maximo ({primaryMetricUnit})</Label>
              <Input
                id="value-max"
                type="number"
                value={valueFilter.max}
                onChange={(e) => setValueFilter((prev) => ({ ...prev, max: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setValueFilter({ min: "", max: "" })} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
            <span className="text-sm font-medium">Voce tem alteracoes nao salvas</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetChanges}>
              <RotateCcw className="mr-2 size-4" />
              Desfazer
            </Button>
            <Button size="sm" onClick={saveAllChanges}>
              <Save className="mr-2 size-4" />
              Salvar Alteracoes
            </Button>
          </div>
        </div>
      )}

      <Card className="border-sky-200 bg-sky-50/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-sky-900">Como editar o historico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-sky-950">
          <p>Use duplo clique em qualquer valor da tabela para entrar no modo de edicao.</p>
          <p><strong>Enter</strong> salva a celula atual e <strong>Esc</strong> cancela a edicao.</p>
          <p><strong>Ctrl + setas</strong> salva o valor atual e navega entre as celulas da pagina atual.</p>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table className="min-w-full text-[11px] text-slate-700">
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
              {Array.from({ length: compactColumnCount || 1 }).map((_, columnIndex) => (
                <Fragment key={`head-group-${columnIndex}`}>
                  <TableHead className="h-8 w-[98px] border-r border-slate-200 bg-slate-50 px-1.5 py-1.5 font-semibold tracking-wide text-slate-600">
                    Hora
                  </TableHead>
                  <TableHead className="h-8 w-[74px] border-r border-slate-300 bg-slate-50 px-1.5 py-1.5 text-right font-semibold tracking-wide text-slate-600 last:border-r-0">
                    {primaryMetricUnit}
                  </TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={Math.max(2, compactColumnCount * 2)} className="h-24 text-center text-slate-500">
                  Carregando dados...
                </TableCell>
              </TableRow>
            ) : paginatedReadings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(2, compactColumnCount * 2)} className="h-24 text-center text-slate-500">
                  Nenhum dado encontrado para os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              Array.from({ length: compactRowCount }).map((_, rowIndex) => (
                <TableRow key={`compact-row-${rowIndex}`} className="border-slate-100 hover:bg-sky-50/70">
                  {Array.from({ length: compactColumnCount }).flatMap((__, columnIndex) => {
                    const reading = paginatedReadings[columnIndex * compactRowCount + rowIndex]

                    if (!reading) {
                      return [
                        <TableCell key={`empty-time-${rowIndex}-${columnIndex}`} className="h-10 border-r border-slate-100 px-1.5 py-1" />,
                        <TableCell key={`empty-value-${rowIndex}-${columnIndex}`} className="h-10 border-r border-slate-200 px-1.5 py-1 last:border-r-0" />,
                      ]
                    }

                    const metricField: MetricField = instrumentType === "PRESSURE" ? "pressure" : "temperature"
                    const rowEdited = isFieldEdited(reading, "temperature") || isFieldEdited(reading, "pressure")
                    const rowOrigin = rowEdited
                      ? "Editado"
                      : reading.temperatureUpdatedUserAt || reading.pressureUpdatedUserAt
                        ? "Ajustado"
                        : "Original"
                    const value = getFieldValue(reading, metricField)

                    return [
                      <TableCell
                        key={`time-${reading.id}`}
                        className="h-10 border-r border-slate-100 px-1.5 py-1 font-medium text-slate-700"
                        title={`${reading.timestamp} | ${rowOrigin}`}
                      >
                        {reading.compactTimestamp}
                      </TableCell>,
                      <TableCell
                        key={`value-${reading.id}`}
                        className="h-10 border-r border-slate-200 px-1.5 py-1 text-right last:border-r-0"
                        title={`Status: ${reading.status} | Origem: ${rowOrigin} | Duplo clique para editar`}
                      >
                        <div className="relative h-8">
                          {editingCell?.id === reading.id && editingCell.field === metricField ? (
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleCellEdit}
                              onBlur={() => saveCellEdit()}
                              onFocus={(e) => e.target.select()}
                              className="absolute inset-0 z-50 h-8 border-2 border-blue-500 bg-white px-2 text-right text-xs text-slate-900 shadow-lg"
                              autoFocus
                            />
                          ) : (
                            <div
                              className={`group flex h-8 cursor-pointer items-center justify-end gap-1 rounded px-1.5 transition-colors hover:bg-blue-50 ${getStatusColor(reading.status)}`}
                              onDoubleClick={() => handleCellDoubleClick(reading, metricField)}
                            >
                              <span className={isFieldEdited(reading, metricField) ? "font-semibold text-sky-700" : "font-semibold"}>
                                {formatNumber(value, 1)}
                              </span>
                              <Edit className="h-3 w-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                          )}
                        </div>
                      </TableCell>,
                    ]
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {paginatedReadings.length} de {filteredReadings.length} registros
          {(valueFilter.min || valueFilter.max) && " (filtrados)"}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || loading}>
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <div className="text-sm">
            Pagina {page} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages || loading}
          >
            Proxima
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
