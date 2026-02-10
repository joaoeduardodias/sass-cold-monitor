"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit,
  RotateCcw,
  Save,
  Trash2
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { getInstrumentsByOrganization } from "@/http/instruments/get-instruments-by-organization"
import { updateInstruments } from "@/http/instruments/update-instruments"

type Instrument = {
  id: string
  name: string
  slug: string
  model: number
  orderDisplay: number
  maxValue: number
  minValue: number
  isActive: boolean
  type: "TEMPERATURE" | "PRESSURE"
  idSitrad: number | null
}

type InstrumentsMapped = {
  id: string
  name: string
  slug: string
  type: string
  typeKey: "TEMPERATURE" | "PRESSURE"
  maxValue: number
  minValue: number
  active: boolean
  status: "online" | "offline"
  orderDisplay: number
  model: number
  idSitrad: number | null
}


type InstrumentSettingsProps = {
  initialInstruments?: Instrument[]
  organizationSlug?: string
}
const instrumentType: Record<string, string> = {
  TEMPERATURE: "Temperatura",
  PRESSURE: "Pressão"
}

const parseInstrumentType = (value: string): "TEMPERATURE" | "PRESSURE" | null => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()

  if (normalized === "temperature" || normalized === "temperatura" || normalized === "temp") {
    return "TEMPERATURE"
  }

  if (normalized === "pressure" || normalized === "pressao" || normalized === "pres") {
    return "PRESSURE"
  }

  if (value.toUpperCase() === "TEMPERATURE") return "TEMPERATURE"
  if (value.toUpperCase() === "PRESSURE") return "PRESSURE"

  return null
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const instrumentsMapped = (instruments: Instrument[]): InstrumentsMapped[] =>
  instruments.map((instrument) => {
    const minValue = Number(instrument.minValue) || 0
    const maxValue = Number(instrument.maxValue) || 0

    return {
      id: instrument.id,
      name: instrument.name,
      slug: instrument.slug,
      type: instrumentType[instrument.type],
      typeKey: instrument.type,
      minValue,
      maxValue,
      active: instrument.isActive,
      status: instrument.isActive ? "online" : "offline",
      orderDisplay: instrument.orderDisplay,
      model: instrument.model,
      idSitrad: instrument.idSitrad,
    }
  })

export function ChamberSettings({ initialInstruments, organizationSlug }: InstrumentSettingsProps) {
  const queryClient = useQueryClient()
  const { data: instrumentsData, isLoading, error } = useQuery({
    queryKey: ["instruments", organizationSlug],
    queryFn: async () => {
      if (!organizationSlug) return []
      const { instruments } = await getInstrumentsByOrganization(organizationSlug)
      return instrumentsMapped(instruments)
    },
    enabled: Boolean(organizationSlug),
    initialData: initialInstruments ? instrumentsMapped(initialInstruments) : [],
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const [instruments, setInstruments] = useState<InstrumentsMapped[]>(() => {
    if (initialInstruments !== undefined) {
      return instrumentsMapped(initialInstruments)
    }
    return []
  })

  const [originalInstruments, setOriginalInstruments] = useState<InstrumentsMapped[]>([])
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const sortedInstruments = useMemo(
    () => [...instruments].sort((a, b) => a.orderDisplay - b.orderDisplay),
    [instruments],
  )
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(instruments.length / itemsPerPage)),
    [instruments.length, itemsPerPage],
  )
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInstruments = useMemo(
    () => sortedInstruments.slice(startIndex, endIndex),
    [sortedInstruments, startIndex, endIndex],
  )

  const lastSyncRef = useRef<string | null>(null)
  const sourceInstruments = useMemo(() => {
    if (organizationSlug && instrumentsData) return instrumentsData
    if (initialInstruments !== undefined) return instrumentsMapped(initialInstruments)
    return null
  }, [organizationSlug, instrumentsData, initialInstruments])

  useEffect(() => {
    if (!sourceInstruments) return

    const hasLocalEdits =
      originalInstruments.length > 0 &&
      JSON.stringify(instruments) !== JSON.stringify(originalInstruments)

    if (hasLocalEdits) return

    const sourceHash = JSON.stringify(sourceInstruments)
    if (lastSyncRef.current === sourceHash) return

    lastSyncRef.current = sourceHash
    setInstruments(sourceInstruments)
    setOriginalInstruments(JSON.parse(JSON.stringify(sourceInstruments)))
    setCurrentPage(1)
  }, [sourceInstruments, instruments, originalInstruments])

  const hasData = instruments.length > 0
  const canFetch = Boolean(organizationSlug) || initialInstruments !== undefined
  const hasError = Boolean(error)

  const activeCount = useMemo(() => instruments.filter((c) => c.active).length, [instruments])
  const onlineCount = useMemo(() => instruments.filter((c) => c.status === "online").length, [instruments])
  const offlineCount = useMemo(() => instruments.filter((c) => c.status === "offline").length, [instruments])

  const hasRealChanges = () => {
    if (originalInstruments.length === 0) return false
    return JSON.stringify(instruments) !== JSON.stringify(originalInstruments)
  }

  const handleCellDoubleClick = (instruments: InstrumentsMapped, field: string) => {
    if (field === "active" || field === "status" || field === "slug") return
    setEditingCell({ id: instruments.id, field })
    const originalValue = instruments[field as keyof InstrumentsMapped]?.toString() || ""
    setEditValue(originalValue)
  }

  const handleCellEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveCellEdit()
      navigateToNextCell("down")
    } else if (e.key === "Tab") {
      e.preventDefault()
      saveCellEdit()
      navigateToNextCell(e.shiftKey ? "left" : "right")
    } else if (e.key === "ArrowDown" && e.ctrlKey) {
      e.preventDefault()
      saveCellEdit()
      navigateToNextCell("down")
    } else if (e.key === "ArrowUp" && e.ctrlKey) {
      e.preventDefault()
      saveCellEdit()
      navigateToNextCell("up")
    } else if (e.key === "ArrowRight" && e.ctrlKey) {
      e.preventDefault()
      saveCellEdit()
      navigateToNextCell("right")
    } else if (e.key === "ArrowLeft" && e.ctrlKey) {
      e.preventDefault()
      saveCellEdit()
      navigateToNextCell("left")
    } else if (e.key === "Escape") {
      setEditingCell(null)
      setEditValue("")
    }
  }

  const saveCellEdit = () => {
    if (!editingCell) return

    let newValue: string | number = editValue

    if (["minValue", "maxValue", "orderDisplay"].includes(editingCell.field)) {
      const numValue = Number.parseFloat(editValue)
      if (isNaN(numValue)) {
        toast.error("Valor inválido")
        return
      }
      newValue = numValue
    }

    setInstruments((prev) =>
      prev.map((instruments) => {
        if (instruments.id !== editingCell.id) return instruments

        if (editingCell.field === "name") {
          const nextName = String(newValue)
          return { ...instruments, name: nextName, slug: slugify(nextName) }
        }

        if (editingCell.field === "type") {
          const parsedType = parseInstrumentType(String(newValue))
          if (!parsedType) {
            toast.error("Tipo inválido. Use Temperatura ou Pressão.")
            return instruments
          }

          return {
            ...instruments,
            typeKey: parsedType,
            type: instrumentType[parsedType],
          }
        }

        return { ...instruments, [editingCell.field]: newValue }
      }),
    )

    setEditingCell(null)
    setEditValue("")
    toast.success("Valor alterado")
  }

  const navigateToNextCell = (direction: "up" | "down" | "left" | "right") => {
    if (!editingCell) return

    const editableFields = [
      "orderDisplay",
      "name",
      "type",
      "minValue",
      "maxValue",
    ]
    const currentInstrumentsIndex = sortedInstruments.findIndex((c) => c.id === editingCell.id)
    const currentFieldIndex = editableFields.indexOf(editingCell.field)

    let nextInstrumentsId = editingCell.id
    let nextField = editingCell.field

    switch (direction) {
      case "down":
        if (currentInstrumentsIndex < sortedInstruments.length - 1) {
          nextInstrumentsId = sortedInstruments[currentInstrumentsIndex + 1].id
        } else {
          nextInstrumentsId = sortedInstruments[0].id
        }
        break

      case "up":
        if (currentInstrumentsIndex > 0) {
          nextInstrumentsId = sortedInstruments[currentInstrumentsIndex - 1].id
        } else {
          nextInstrumentsId = sortedInstruments[sortedInstruments.length - 1].id
        }
        break

      case "right":
        if (currentFieldIndex < editableFields.length - 1) {
          nextField = editableFields[currentFieldIndex + 1]
        } else {
          nextField = editableFields[0]
          if (currentInstrumentsIndex < sortedInstruments.length - 1) {
            nextInstrumentsId = sortedInstruments[currentInstrumentsIndex + 1].id
          } else {
            nextInstrumentsId = sortedInstruments[0].id
          }
        }
        break

      case "left":
        if (currentFieldIndex > 0) {
          nextField = editableFields[currentFieldIndex - 1]
        } else {
          nextField = editableFields[editableFields.length - 1]
          if (currentInstrumentsIndex > 0) {
            nextInstrumentsId = sortedInstruments[currentInstrumentsIndex - 1].id
          } else {
            nextInstrumentsId = sortedInstruments[sortedInstruments.length - 1].id
          }
        }
        break
    }

    const targetInstruments = instruments.find((c) => c.id === nextInstrumentsId)
    if (targetInstruments) {
      setEditingCell({ id: nextInstrumentsId, field: nextField })
      setEditValue(targetInstruments[nextField as keyof InstrumentsMapped]?.toString() || "")
    }
  }

  const moveOrderDisplay = (instrumentsId: string, direction: "up" | "down") => {
    const instrument = instruments.find((c) => c.id === instrumentsId)
    if (!instrument) return

    const currentOrder = instrument.orderDisplay
    const targetOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1

    const targetInstruments = instruments.find((c) => c.orderDisplay === targetOrder)

    if (targetInstruments) {
      setInstruments((prev) =>
        prev.map((c) => {
          if (c.id === instrumentsId) {
            return { ...c, orderDisplay: targetOrder }
          }
          if (c.id === targetInstruments.id) {
            return { ...c, orderDisplay: currentOrder }
          }
          return c
        }),
      )

      toast.success(`Ordem alterada: ${instrument.name}`)
    }
  }

  const toggleInstrumentsActive = (id: string) => {
    setInstruments((prev) =>
      prev.map((instruments) =>
        instruments.id === id
          ? {
            ...instruments,
            active: !instruments.active,
            status: instruments.active ? "offline" : "online",
          }
          : instruments,
      ),
    )
    toast.success("Status da câmara alterado")
  }

  const deleteInstruments = (id: string) => {
    setInstruments(instruments.filter((c) => c.id !== id))
    toast.success("Câmara removida")
  }

  const { mutateAsync: updateInstrumentsMutation, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!organizationSlug) {
        toast.error("Slug da organização não informado")
        return
      }

      await updateInstruments({
        org: organizationSlug,
        instruments: instruments.map((instrument) => ({
          id: instrument.id,
          name: instrument.name,
          model: instrument.model,
          orderDisplay: instrument.orderDisplay,
          maxValue: instrument.maxValue,
          minValue: instrument.minValue,
          isActive: instrument.active,
          type: instrument.typeKey,
          idSitrad: instrument.idSitrad,
        })),
      })

    },
    onSuccess: async () => {
      setOriginalInstruments(JSON.parse(JSON.stringify(instruments)))
      await queryClient.invalidateQueries({ queryKey: ["instruments", organizationSlug] })
      toast.success("Todas as alterações foram salvas!")
    },
    onError: () => {
      toast.error("Não foi possível salvar as alterações. Tente novamente.")
    },
  })

  const saveAllChanges = async () => {
    await updateInstrumentsMutation()
  }

  const resetChanges = () => {
    setInstruments(JSON.parse(JSON.stringify(originalInstruments)))
    toast.info("Alterações descartadas")
  }

  const exportConfig = () => {
    const config = instruments.map(({ status, ...instruments }) => instruments)
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "configuracao-camaras.json"
    a.click()
    toast.success("Configuração exportada")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Online
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            Offline
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            Manutenção
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const generatePaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {

      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage(i)
              }}
              isActive={currentPage === i}
              className="size-9 rounded-full border border-transparent text-sm transition-colors hover:border-blue-200 hover:bg-blue-50 data-[active=true]:border-blue-600 data-[active=true]:bg-blue-600 data-[active=true]:text-white"
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        )
      }
    } else {

      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(i)
                }}
                isActive={currentPage === i}
                className="size-9 rounded-full border border-transparent text-sm transition-colors hover:border-blue-200 hover:bg-blue-50 data-[active=true]:border-blue-600 data-[active=true]:bg-blue-600 data-[active=true]:text-white"
              >
                {i}
              </PaginationLink>
            </PaginationItem>,
          )
        }
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>,
        )
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage(totalPages)
              }}
              className="size-9 rounded-full border border-transparent text-sm transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>,
        )
      } else if (currentPage >= totalPages - 2) {
        items.push(
          <PaginationItem key={1}>
            <PaginationLink
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage(1)
              }}
              className="size-9 rounded-full border border-transparent text-sm transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              1
            </PaginationLink>
          </PaginationItem>,
        )
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>,
        )
        for (let i = totalPages - 3; i <= totalPages; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(i)
                }}
                isActive={currentPage === i}
                className="size-9 rounded-full border border-transparent text-sm transition-colors hover:border-blue-200 hover:bg-blue-50 data-[active=true]:border-blue-600 data-[active=true]:bg-blue-600 data-[active=true]:text-white"
              >
                {i}
              </PaginationLink>
            </PaginationItem>,
          )
        }
      } else {

        items.push(
          <PaginationItem key={1}>
            <PaginationLink
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage(1)
              }}
              className="size-9 rounded-full border border-transparent text-sm transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              1
            </PaginationLink>
          </PaginationItem>,
        )
        items.push(
          <PaginationItem key="ellipsis3">
            <PaginationEllipsis />
          </PaginationItem>,
        )
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(i)
                }}
                isActive={currentPage === i}
                className="size-9 rounded-full border border-transparent text-sm transition-colors hover:border-blue-200 hover:bg-blue-50 data-[active=true]:border-blue-600 data-[active=true]:bg-blue-600 data-[active=true]:text-white"
              >
                {i}
              </PaginationLink>
            </PaginationItem>,
          )
        }
        items.push(
          <PaginationItem key="ellipsis4">
            <PaginationEllipsis />
          </PaginationItem>,
        )
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage(totalPages)
              }}
              className="size-9 rounded-full border border-transparent text-sm transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>,
        )
      }
    }

    return items
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{instruments.length}</div>
              <div className="text-sm text-muted-foreground">Total de Câmaras</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
              <div className="text-sm text-muted-foreground">Ativas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {onlineCount}
              </div>
              <div className="text-sm text-muted-foreground">Online</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {offlineCount}
              </div>
              <div className="text-sm text-muted-foreground">Offline</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!canFetch && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Selecione uma organização para carregar os instrumentos.
          </p>
        </div>
      )}

      {canFetch && isLoading && !hasData && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">Carregando instrumentos...</p>
        </div>
      )}

      {canFetch && hasError && !hasData && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os instrumentos. Tente novamente.
          </p>
        </div>
      )}

      {canFetch && !isLoading && !hasData && !hasError && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum instrumento encontrado. Cadastre um instrumento para começar.
          </p>
        </div>
      )}

      <div className="flex items-center justify-start">
        <Button variant="outline" onClick={exportConfig} disabled={!hasData}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {hasRealChanges() && (
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium">Você tem alterações não salvas</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetChanges}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Descartar
            </Button>
            <Button size="sm" onClick={saveAllChanges} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar Tudo"}
            </Button>
          </div>
        </div>
      )}

      <div className={`rounded-md border ${!hasData ? "opacity-60 pointer-events-none" : ""}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Ordem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Min (°C)</TableHead>
              <TableHead>Max (°C)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInstruments.map((instruments) => (
              <TableRow key={instruments.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{instruments.orderDisplay}</span>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0"
                        onClick={() => moveOrderDisplay(instruments.id, "up")}
                        disabled={instruments.orderDisplay === 1}
                      >
                        <ArrowUp className="h-2 w-2" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0"
                        onClick={() => moveOrderDisplay(instruments.id, "down")}
                        disabled={instruments.orderDisplay === instrumentsMapped.length}
                      >
                        <ArrowDown className="h-2 w-2" />
                      </Button>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="font-medium min-w-[120px]">
                  <div className="relative h-8">
                    {editingCell?.id === instruments.id && editingCell?.field === "name" ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleCellEdit}
                        onBlur={saveCellEdit}
                        onFocus={(e) => e.target.select()}
                        className="absolute inset-0 h-8 border-2 border-blue-500 bg-white shadow-lg z-50 text-sm"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="flex items-center h-8 px-2 rounded hover:bg-blue-50 transition-colors cursor-pointer group"
                        onDoubleClick={() => handleCellDoubleClick(instruments, "name")}
                      >
                        <span className="truncate flex-1">{instruments.name}</span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                      </div>
                    )}
                  </div>
                </TableCell>


                <TableCell className="min-w-[140px]">
                  <div className="relative h-8">
                    <div className="flex items-center h-8 px-2 rounded bg-muted/30 text-muted-foreground">
                      <span className="truncate flex-1">{instruments.slug}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="min-w-[120px]">
                  <div className="relative h-8">
                    <Select
                      value={instruments.typeKey}
                      onValueChange={(value) => {
                        if (value !== "TEMPERATURE" && value !== "PRESSURE") return
                        setInstruments((prev) =>
                          prev.map((item) =>
                            item.id === instruments.id
                              ? {
                                ...item,
                                typeKey: value,
                                type: instrumentType[value],
                              }
                              : item,
                          ),
                        )
                        toast.success("Tipo atualizado")
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEMPERATURE">Temperatura</SelectItem>
                        <SelectItem value="PRESSURE">Pressão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>

                <TableCell className="w-20">
                  <div className="relative h-8">
                    {editingCell?.id === instruments.id && editingCell?.field === "minValue" ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleCellEdit}
                        onBlur={saveCellEdit}
                        onFocus={(e) => e.target.select()}
                        type="number"
                        className="absolute inset-0 h-8 border-2 border-blue-500 bg-white shadow-lg z-50 text-sm text-center"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center h-8 px-2 rounded hover:bg-blue-50 transition-colors cursor-pointer group"
                        onDoubleClick={() => handleCellDoubleClick(instruments, "minValue")}
                      >
                        <span className="font-mono text-sm">{instruments.minValue.toFixed(1)}</span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="w-20">
                  <div className="relative h-8">
                    {editingCell?.id === instruments.id && editingCell?.field === "maxValue" ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleCellEdit}
                        onBlur={saveCellEdit}
                        onFocus={(e) => e.target.select()}
                        type="number"
                        className="absolute inset-0 h-8 border-2 border-blue-500 bg-white shadow-lg z-50 text-sm text-center"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center h-8 px-2 rounded hover:bg-blue-50 transition-colors cursor-pointer group"
                        onDoubleClick={() => handleCellDoubleClick(instruments, "maxValue")}
                      >
                        <span className="font-mono text-sm">{instruments.maxValue.toFixed(1)}</span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="w-[100px]">{getStatusBadge(instruments.status)}</TableCell>

                <TableCell className="w-20">
                  <div className="flex justify-center">
                    <Switch checked={instruments.active} onCheckedChange={() => toggleInstrumentsActive(instruments.id)} />
                  </div>
                </TableCell>

                <TableCell className="w-[100px]">
                  <div className="flex items-center gap-1">

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteInstruments(instruments.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${!hasData ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="w-full flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mostrar</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-16 h-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
          <span>
            de {instruments.length} câmaras
          </span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Página {currentPage} de {totalPages}</span>
        </div>

        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) setCurrentPage(currentPage - 1)
                }}
                className={`size-9 rounded-full ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                <ChevronsLeft />
              </Button>
            </PaginationItem>

            {generatePaginationItems()}

            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                }}
                className={`size-9 rounded-full ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}
              >
                <ChevronsRight />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {hasData && (
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Como usar</h4>
              <div className="mt-2 space-y-1 text-sm text-blue-800">
                <p>
                  • <strong>Duplo clique</strong> em qualquer célula para editar
                </p>
                <p>
                  • <strong>Enter</strong> salva e vai para a linha de baixo
                </p>
                <p>
                  • <strong>Tab</strong> salva e vai para a próxima coluna (Shift+Tab para anterior)
                </p>
                <p>
                  • <strong>Ctrl + Setas</strong> navega entre células salvando automaticamente
                </p>
                <p>
                  • <strong>Escape</strong> cancela a edição
                </p>
                <p>
                  • <strong>Ordem de exibição</strong> controla como as câmaras aparecem no dashboard
                </p>
                <p>
                  • <strong>Setas ↑↓</strong> na coluna Ordem para reordenar rapidamente
                </p>
                <p>
                  • <strong>Selecione múltiplas câmaras</strong> para edição em massa
                </p>
                <p>
                  • <strong>Use os switches</strong> para ativar/desativar câmaras
                </p>
                <p>
                  • <strong>Exporte/Importe</strong> configurações para backup
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
