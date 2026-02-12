"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AuditLog,
  auditLogTypes,
  AuditLogType,
  getAuditLogs,
} from "@/http/audit-logs/get-audit-logs"
import { getOrganizations } from "@/http/organizations/get-organizations"
import { ChevronsLeft, ChevronsRight, Clock, Filter, RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type SecuritySettingsProps = {
  organizationSlug?: string
}

type OrganizationOption = {
  id: string
  name: string
  slug: string
}

type TimeRangeOption = "24h" | "7d" | "30d" | "90d" | "custom"

const ALL_ORGANIZATIONS = "__all__"

const timeRangeLabels: Record<TimeRangeOption, string> = {
  "24h": "Últimas 24 horas",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  custom: "Período customizado",
}

const typeLabels: Record<AuditLogType, string> = {
  SYSTEM: "Sistema",
  MEMBER: "Membros",
  INVITE: "Convites",
  INSTRUMENT: "Instrumentos",
  DATA: "Leituras",
  NOTIFICATION: "Notificações",
}

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const

const toDateTimeLocal = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const resolveDateRange = (timeRange: TimeRangeOption, customStart: string, customEnd: string) => {
  const now = new Date()

  if (timeRange === "custom") {
    return {
      startDate: customStart ? new Date(customStart).toISOString() : undefined,
      endDate: customEnd ? new Date(customEnd).toISOString() : undefined,
    }
  }

  const rangeDays: Record<Exclude<TimeRangeOption, "custom">, number> = {
    "24h": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
  }

  const start = new Date(now)
  start.setDate(now.getDate() - rangeDays[timeRange])

  return {
    startDate: start.toISOString(),
    endDate: now.toISOString(),
  }
}

const formatDateTime = (value: string) => {
  const date = new Date(value)

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date)
}

const getStatusBadge = (status: AuditLog["status"]) => {
  if (status === "success") {
    return <Badge className="bg-green-600 hover:bg-green-600">Sucesso</Badge>
  }

  return <Badge className="bg-red-600 hover:bg-red-600">Falha</Badge>
}

export function SecuritySettings({ organizationSlug }: SecuritySettingsProps) {
  const defaultRangeEnd = useMemo(() => new Date(), [])
  const defaultRangeStart = useMemo(() => {
    const start = new Date(defaultRangeEnd)
    start.setDate(defaultRangeEnd.getDate() - 7)

    return start
  }, [defaultRangeEnd])

  const [selectedOrganization, setSelectedOrganization] = useState<string>(
    organizationSlug ?? ALL_ORGANIZATIONS,
  )
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("7d")
  const [customStart, setCustomStart] = useState<string>(toDateTimeLocal(defaultRangeStart))
  const [customEnd, setCustomEnd] = useState<string>(toDateTimeLocal(defaultRangeEnd))
  const [selectedType, setSelectedType] = useState<"ALL" | AuditLogType>("ALL")
  const [actorFilter, setActorFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const {
    data: organizations = [],
    error: organizationsError,
  } = useQuery<OrganizationOption[]>({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { organizations: response } = await getOrganizations()
      return response.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
      }))
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (organizationSlug) {
      setSelectedOrganization(organizationSlug)
    }
  }, [organizationSlug])

  useEffect(() => {
    if (organizationsError) {
      toast.error("Não foi possível carregar as organizações.")
    }
  }, [organizationsError])

  const { startDate, endDate } = useMemo(
    () => resolveDateRange(timeRange, customStart, customEnd),
    [timeRange, customStart, customEnd],
  )

  const customRangeInvalid =
    timeRange === "custom" &&
    (!!startDate && !!endDate ? new Date(startDate) > new Date(endDate) : true)

  const organizationExists =
    selectedOrganization === ALL_ORGANIZATIONS ||
    organizations.some((org) => org.slug === selectedOrganization)

  const canQueryAuditLogs = organizations.length > 0 && organizationExists && !customRangeInvalid

  const {
    data: auditData,
    error: auditLogsError,
    isFetching,
    isPending,
    refetch,
  } = useQuery({
    queryKey: [
      "audit-logs",
      selectedOrganization,
      startDate,
      endDate,
      selectedType,
      actorFilter,
      currentPage,
      pageSize,
      organizations.map((org) => org.slug).join("|"),
    ],
    queryFn: async () => {
      const targetOrganizations =
        selectedOrganization === ALL_ORGANIZATIONS
          ? organizations.map((org) => org.slug)
          : [selectedOrganization]

      if (targetOrganizations.length === 0) {
        return {
          logs: [] as AuditLog[],
          totalLogs: 0,
          totalPages: 1,
          page: 1,
        }
      }

      if (selectedOrganization === ALL_ORGANIZATIONS) {
        const totalRequested = currentPage * pageSize
        const responses = await Promise.all(
          targetOrganizations.map((orgSlug) =>
            getAuditLogs({
              org: orgSlug,
              startDate,
              endDate,
              type: selectedType === "ALL" ? undefined : selectedType,
              actor: actorFilter,
              page: 1,
              pageSize: totalRequested,
            }),
          ),
        )

        const mergedLogs = responses
          .flatMap((response) => response.logs)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        const totalLogs = responses.reduce((acc, response) => acc + response.pagination.total, 0)
        const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize))
        const safePage = Math.min(currentPage, totalPages)
        const startIndex = (safePage - 1) * pageSize
        const endIndex = startIndex + pageSize

        return {
          logs: mergedLogs.slice(startIndex, endIndex),
          totalLogs,
          totalPages,
          page: safePage,
        }
      }

      const response = await getAuditLogs({
        org: selectedOrganization,
        startDate,
        endDate,
        type: selectedType === "ALL" ? undefined : selectedType,
        actor: actorFilter,
        page: currentPage,
        pageSize,
      })

      return {
        logs: response.logs,
        totalLogs: response.pagination.total,
        totalPages: response.pagination.totalPages,
        page: response.pagination.page,
      }
    },
    enabled: canQueryAuditLogs,
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (auditLogsError) {
      toast.error("Não foi possível carregar os logs de auditoria.")
    }
  }, [auditLogsError])

  useEffect(() => {
    if (auditData?.page && auditData.page !== currentPage) {
      setCurrentPage(auditData.page)
    }
  }, [auditData?.page, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedOrganization, timeRange, customStart, customEnd, selectedType, actorFilter, pageSize])

  const logs = auditData?.logs ?? []
  const totalLogs = auditData?.totalLogs ?? 0
  const totalPages = auditData?.totalPages ?? 1

  const groupedLogs = useMemo(() => {
    if (selectedOrganization !== ALL_ORGANIZATIONS) {
      const organizationName = organizations.find((org) => org.slug === selectedOrganization)?.name

      return [
        {
          slug: selectedOrganization,
          name: organizationName ?? selectedOrganization,
          logs,
        },
      ]
    }

    const grouped = new Map<string, { name: string; logs: AuditLog[] }>()

    for (const log of logs) {
      const group = grouped.get(log.organizationSlug)
      if (group) {
        group.logs.push(log)
      } else {
        grouped.set(log.organizationSlug, {
          name: log.organizationName,
          logs: [log],
        })
      }
    }

    return Array.from(grouped.entries()).map(([slug, group]) => ({
      slug,
      name: group.name,
      logs: group.logs,
    }))
  }, [logs, organizations, selectedOrganization])

  const generatePaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
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
      return items
    }

    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
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
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>,
      )
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
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
      return items
    }

    if (currentPage >= totalPages - 2) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
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
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>,
      )
      for (let i = totalPages - 3; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
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
      return items
    }

    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          href="#"
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
      <PaginationItem key="ellipsis-middle-left">
        <PaginationEllipsis />
      </PaginationItem>,
    )
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
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
      <PaginationItem key="ellipsis-middle-right">
        <PaginationEllipsis />
      </PaginationItem>,
    )
    items.push(
      <PaginationItem key={totalPages}>
        <PaginationLink
          href="#"
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

    return items
  }

  const handleRefresh = async () => {
    if (customRangeInvalid) {
      toast.error("A data inicial precisa ser menor que a data final.")
      return
    }

    if (!organizationExists) {
      toast.error("Selecione uma organização válida.")
      return
    }

    await refetch()
  }

  const loading = isFetching

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtros de Auditoria
          </CardTitle>
          <CardDescription>Filtre logs por organização, período, categoria e usuário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Organização</Label>
              <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a organização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ORGANIZATIONS}>Todas as organizações</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.slug}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRangeOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(timeRangeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as "ALL" | AuditLogType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {auditLogTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actor-filter">Usuário / Autor</Label>
              <Input
                id="actor-filter"
                value={actorFilter}
                onChange={(event) => setActorFilter(event.target.value)}
                placeholder="Ex.: joao"
              />
            </div>
          </div>

          {timeRange === "custom" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="custom-start">Data inicial</Label>
                <Input
                  id="custom-start"
                  type="datetime-local"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-end">Data final</Label>
                <Input
                  id="custom-end"
                  type="datetime-local"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-end justify-end gap-4">
            <Button onClick={() => void handleRefresh()} disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Atualizar logs
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium">Logs de Auditoria</h3>
        </div>

        {!canQueryAuditLogs ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Ajuste os filtros para carregar os logs.
            </CardContent>
          </Card>
        ) : groupedLogs.length === 0 || logs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {isPending ? "Carregando logs..." : "Nenhum log encontrado para os filtros selecionados."}
            </CardContent>
          </Card>
        ) : (
          groupedLogs.map((group) => (
            <Card key={group.slug}>
              <CardHeader>
                <CardTitle className="text-base">{group.name}</CardTitle>
                <CardDescription>{group.logs.length} evento(s) encontrado(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Detalhes</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">{formatDateTime(log.timestamp)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{typeLabels[log.type]}</Badge>
                          </TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.details}</TableCell>
                          <TableCell>{log.actor ?? "Sistema"}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Mostrando</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number.parseInt(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-16 h-6">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>de {totalLogs} eventos</span>
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
      </div>
    </div>
  )
}
