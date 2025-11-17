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
import { useEffect, useState } from "react"
import { toast } from "sonner"

type Chamber = {
  id: number
  name: string
  active: boolean
  minTemp: number
  maxTemp: number
  setpoint: number
  differential: number
  location: string
  type: string
  lastMaintenance: string
  status: "online" | "offline" | "maintenance"
  displayOrder: number
}

export function ChamberSettings() {
  const [chambers, setChambers] = useState<Chamber[]>([
    {
      id: 1,
      name: "Câmara 01",
      active: true,
      minTemp: -22,
      maxTemp: -16,
      setpoint: -18,
      differential: 2.0,
      location: "Setor A",
      type: "Congelados",
      lastMaintenance: "2024-01-10",
      status: "online",
      displayOrder: 1,
    },
    {
      id: 2,
      name: "Câmara 02",
      active: true,
      minTemp: -22,
      maxTemp: -16,
      setpoint: -18,
      differential: 1.5,
      location: "Setor A",
      type: "Congelados",
      lastMaintenance: "2024-01-08",
      status: "online",
      displayOrder: 2,
    },
    {
      id: 3,
      name: "Câmara 03",
      active: true,
      minTemp: -25,
      maxTemp: -15,
      setpoint: -20,
      differential: 2.5,
      location: "Setor B",
      type: "Ultra Congelados",
      lastMaintenance: "2024-01-12",
      status: "online",
      displayOrder: 3,
    },
    {
      id: 4,
      name: "Câmara 04",
      active: false,
      minTemp: -22,
      maxTemp: -16,
      setpoint: -18,
      differential: 1.8,
      location: "Setor B",
      type: "Congelados",
      lastMaintenance: "2024-01-05",
      status: "maintenance",
      displayOrder: 4,
    },
    {
      id: 5,
      name: "Câmara 05",
      active: true,
      minTemp: -24,
      maxTemp: -18,
      setpoint: -21,
      differential: 3.0,
      location: "Setor C",
      type: "Ultra Congelados",
      lastMaintenance: "2024-01-15",
      status: "online",
      displayOrder: 5,
    },
    {
      id: 6,
      name: "Câmara 06",
      active: true,
      minTemp: -22,
      maxTemp: -16,
      setpoint: -19,
      differential: 2.2,
      location: "Setor C",
      type: "Congelados",
      lastMaintenance: "2024-01-11",
      status: "offline",
      displayOrder: 6,
    },
  ])

  const [originalChambers, setOriginalChambers] = useState<Chamber[]>([])
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const sortedChambers = [...chambers].sort((a, b) => a.displayOrder - b.displayOrder)
  const totalPages = Math.ceil(chambers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedChambers = sortedChambers.slice(startIndex, endIndex)


  useEffect(() => {
    setOriginalChambers(JSON.parse(JSON.stringify(chambers)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasRealChanges = () => {
    if (originalChambers.length === 0) return false

    return JSON.stringify(chambers) !== JSON.stringify(originalChambers)
  }

  const handleCellDoubleClick = (chamber: Chamber, field: string) => {
    if (field === "active" || field === "status") return
    setEditingCell({ id: chamber.id, field })
    // setEditValue(chamber[field as keyof Chamber]?.toString() || "")
    const originalValue = chamber[field as keyof Chamber]?.toString() || ""
    setEditValue(originalValue)
  }

  const handleCellEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveCellEdit()
      // Navegar para a linha de baixo na mesma coluna
      navigateToNextCell("down")
    } else if (e.key === "Tab") {
      e.preventDefault()
      saveCellEdit()
      // Navegar para a próxima coluna (direita) ou primeira coluna da próxima linha
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

    // Converter para número se necessário
    if (["minTemp", "maxTemp", "setpoint", "differential", "displayOrder"].includes(editingCell.field)) {
      const numValue = Number.parseFloat(editValue)
      if (isNaN(numValue)) {
        toast.error("Valor inválido")
        return
      }
      newValue = numValue
    }

    setChambers((prev) =>
      prev.map((chamber) => (chamber.id === editingCell.id ? { ...chamber, [editingCell.field]: newValue } : chamber)),
    )

    setEditingCell(null)
    setEditValue("")
    toast.success("Valor alterado")
  }

  const navigateToNextCell = (direction: "up" | "down" | "left" | "right") => {
    if (!editingCell) return

    const editableFields = [
      "displayOrder",
      "name",
      "location",
      "type",
      "minTemp",
      "maxTemp",
      "setpoint",
      "differential",
    ]
    const currentChamberIndex = sortedChambers.findIndex((c) => c.id === editingCell.id)
    const currentFieldIndex = editableFields.indexOf(editingCell.field)

    let nextChamberId = editingCell.id
    let nextField = editingCell.field

    switch (direction) {
      case "down":
        // Próxima linha, mesma coluna
        if (currentChamberIndex < sortedChambers.length - 1) {
          nextChamberId = sortedChambers[currentChamberIndex + 1].id
        } else {
          // Se estiver na última linha, vai para a primeira linha
          nextChamberId = sortedChambers[0].id
        }
        break

      case "up":
        // Linha anterior, mesma coluna
        if (currentChamberIndex > 0) {
          nextChamberId = sortedChambers[currentChamberIndex - 1].id
        } else {
          // Se estiver na primeira linha, vai para a última linha
          nextChamberId = sortedChambers[sortedChambers.length - 1].id
        }
        break

      case "right":
        // Próxima coluna, mesma linha
        if (currentFieldIndex < editableFields.length - 1) {
          nextField = editableFields[currentFieldIndex + 1]
        } else {
          // Se estiver na última coluna, vai para a primeira coluna da próxima linha
          nextField = editableFields[0]
          if (currentChamberIndex < sortedChambers.length - 1) {
            nextChamberId = sortedChambers[currentChamberIndex + 1].id
          } else {
            // Se estiver na última linha e coluna, vai para a primeira linha
            nextChamberId = sortedChambers[0].id
          }
        }
        break

      case "left":
        // Coluna anterior, mesma linha
        if (currentFieldIndex > 0) {
          nextField = editableFields[currentFieldIndex - 1]
        } else {
          // Se estiver na primeira coluna, vai para a última coluna da linha anterior
          nextField = editableFields[editableFields.length - 1]
          if (currentChamberIndex > 0) {
            nextChamberId = sortedChambers[currentChamberIndex - 1].id
          } else {
            // Se estiver na primeira linha e coluna, vai para a última linha
            nextChamberId = sortedChambers[sortedChambers.length - 1].id
          }
        }
        break
    }

    // Encontrar a câmara de destino
    const targetChamber = chambers.find((c) => c.id === nextChamberId)
    if (targetChamber) {
      setEditingCell({ id: nextChamberId, field: nextField })
      setEditValue(targetChamber[nextField as keyof Chamber]?.toString() || "")
    }
  }

  const moveDisplayOrder = (chamberId: number, direction: "up" | "down") => {
    const chamber = chambers.find((c) => c.id === chamberId)
    if (!chamber) return

    const currentOrder = chamber.displayOrder
    const targetOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1

    // Encontrar a câmara que tem a ordem de destino
    const targetChamber = chambers.find((c) => c.displayOrder === targetOrder)

    if (targetChamber) {
      setChambers((prev) =>
        prev.map((c) => {
          if (c.id === chamberId) {
            return { ...c, displayOrder: targetOrder }
          }
          if (c.id === targetChamber.id) {
            return { ...c, displayOrder: currentOrder }
          }
          return c
        }),
      )

      toast.success(`Ordem alterada: ${chamber.name}`)
    }
  }

  const toggleChamberActive = (id: number) => {
    setChambers((prev) =>
      prev.map((chamber) => (chamber.id === id ? { ...chamber, active: !chamber.active } : chamber)),
    )
    toast.success("Status da câmara alterado")
  }

  const deleteChamber = (id: number) => {
    setChambers(chambers.filter((c) => c.id !== id))
    toast.success("Câmara removida")
  }

  const saveAllChanges = async () => {
    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Atualizar dados originais após salvar
    setOriginalChambers(JSON.parse(JSON.stringify(chambers)))
    toast.success("Todas as alterações foram salvas!")
  }

  const resetChanges = () => {
    setChambers(JSON.parse(JSON.stringify(originalChambers)))
    toast.info("Alterações descartadas")
  }

  const exportConfig = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const config = chambers.map(({ status, lastMaintenance, ...chamber }) => chamber)
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
              <div className="text-2xl font-bold text-blue-600">{chambers.length}</div>
              <div className="text-sm text-muted-foreground">Total de Câmaras</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{chambers.filter((c) => c.active).length}</div>
              <div className="text-sm text-muted-foreground">Ativas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {chambers.filter((c) => c.status === "online").length}
              </div>
              <div className="text-sm text-muted-foreground">Online</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {chambers.filter((c) => c.status === "offline").length}
              </div>
              <div className="text-sm text-muted-foreground">Offline</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-start">
        <Button variant="outline" onClick={exportConfig}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Controles de Alterações - Só aparece se houver mudanças reais */}
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
            <Button size="sm" onClick={saveAllChanges}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Tudo
            </Button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Ordem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Min (°C)</TableHead>
              <TableHead>Max (°C)</TableHead>
              <TableHead>Setpoint (°C)</TableHead>
              <TableHead>Diferencial (°C)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChambers.map((chamber) => (
              <TableRow key={chamber.id}>
                {/* Ordem de Exibição */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{chamber.displayOrder}</span>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0"
                        onClick={() => moveDisplayOrder(chamber.id, "up")}
                        disabled={chamber.displayOrder === 1}
                      >
                        <ArrowUp className="h-2 w-2" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0"
                        onClick={() => moveDisplayOrder(chamber.id, "down")}
                        disabled={chamber.displayOrder === chambers.length}
                      >
                        <ArrowDown className="h-2 w-2" />
                      </Button>
                    </div>
                  </div>
                </TableCell>

                {/* Nome */}
                <TableCell className="font-medium min-w-[120px]">
                  <div className="relative h-8">
                    {editingCell?.id === chamber.id && editingCell?.field === "name" ? (
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
                        onDoubleClick={() => handleCellDoubleClick(chamber, "name")}
                      >
                        <span className="truncate flex-1">{chamber.name}</span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                      </div>
                    )}
                  </div>
                </TableCell>


                <TableCell className="min-w-[100px]">
                  <div className="relative h-8">
                    {editingCell?.id === chamber.id && editingCell?.field === "location" ? (
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
                        onDoubleClick={() => handleCellDoubleClick(chamber, "location")}
                      >
                        <span className="truncate flex-1">{chamber.location}</span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="min-w-[120px]">
                  <div className="relative h-8">
                    {editingCell?.id === chamber.id && editingCell?.field === "type" ? (
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
                        onDoubleClick={() => handleCellDoubleClick(chamber, "type")}
                      >
                        <span className="truncate flex-1">{chamber.type}</span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="w-20">
                  <div className="relative h-8">
                    {editingCell?.id === chamber.id && editingCell?.field === "minTemp" ? (
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
                        onDoubleClick={() => handleCellDoubleClick(chamber, "minTemp")}
                      >
                        <span className="font-mono text-sm">{chamber.minTemp.toFixed(1)}</span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="w-20">
                  <div className="relative h-8">
                    {editingCell?.id === chamber.id && editingCell?.field === "maxTemp" ? (
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
                        onDoubleClick={() => handleCellDoubleClick(chamber, "maxTemp")}
                      >
                        <span className="font-mono text-sm">{chamber.maxTemp.toFixed(1)}</span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Setpoint */}
                <TableCell className="w-[90px]">
                  <div className="relative h-8">
                    {editingCell?.id === chamber.id && editingCell?.field === "setpoint" ? (
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
                        onDoubleClick={() => handleCellDoubleClick(chamber, "setpoint")}
                      >
                        <span className="font-mono text-sm font-medium text-green-600">
                          {chamber.setpoint.toFixed(1)}
                        </span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="w-[100px]">
                  <div className="relative h-8">
                    {editingCell?.id === chamber.id && editingCell?.field === "differential" ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleCellEdit}
                        onBlur={saveCellEdit}
                        onFocus={(e) => e.target.select()}
                        type="number"
                        step="0.1"
                        className="absolute inset-0 h-8 border-2 border-blue-500 bg-white shadow-lg z-50 text-sm text-center"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center h-8 px-2 rounded hover:bg-blue-50 transition-colors cursor-pointer group"
                        onDoubleClick={() => handleCellDoubleClick(chamber, "differential")}
                      >
                        <span className="font-mono text-sm text-purple-600">{chamber.differential.toFixed(1)}</span>
                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="w-[100px]">{getStatusBadge(chamber.status)}</TableCell>

                <TableCell className="w-20">
                  <div className="flex justify-center">
                    <Switch checked={chamber.active} onCheckedChange={() => toggleChamberActive(chamber.id)} />
                  </div>
                </TableCell>

                <TableCell className="w-[100px]">
                  <div className="flex items-center gap-1">

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteChamber(chamber.id)}
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
      <div className="flex items-center justify-between">
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
            de {chambers.length} câmaras
          </span>
        </div>

        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) setCurrentPage(currentPage - 1)
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              >
                <ChevronsLeft />
              </Button>
            </PaginationItem>

            {generatePaginationItems()}

            <PaginationItem>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              >
                <ChevronsRight />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>


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
    </div>
  )
}
