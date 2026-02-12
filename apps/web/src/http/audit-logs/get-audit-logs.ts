import { api } from "../api"

export const auditLogTypes = ["SYSTEM", "MEMBER", "INVITE", "INSTRUMENT", "DATA", "NOTIFICATION"] as const

export type AuditLogType = (typeof auditLogTypes)[number]

export type AuditLog = {
  id: string
  timestamp: string
  organizationSlug: string
  organizationName: string
  type: AuditLogType
  action: string
  details: string
  actor: string | null
  status: "success" | "failed"
}

type GetAuditLogsParams = {
  org: string
  startDate?: string
  endDate?: string
  type?: AuditLogType
  actor?: string
  page?: number
  pageSize?: number
}

type GetAuditLogsResponse = {
  logs: AuditLog[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export async function getAuditLogs(params: GetAuditLogsParams) {
  const searchParams = new URLSearchParams()

  if (params.startDate) searchParams.set("startDate", params.startDate)
  if (params.endDate) searchParams.set("endDate", params.endDate)
  if (params.type) searchParams.set("type", params.type)
  if (params.actor?.trim()) searchParams.set("actor", params.actor.trim())
  if (params.page) searchParams.set("page", String(params.page))
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize))

  const query = searchParams.toString()
  const endpoint = query
    ? `organizations/${params.org}/audit-logs?${query}`
    : `organizations/${params.org}/audit-logs`

  return api.get(endpoint).json<GetAuditLogsResponse>()
}
