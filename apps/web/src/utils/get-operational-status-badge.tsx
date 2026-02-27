import type { OperationalStatus } from "@/components/instrument-grid.types"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Fan, Power, Snowflake, Waves } from "lucide-react"

export function mapOperationalStatus(status?: string): OperationalStatus {
  if (!status) return "idle"

  const normalized = status.toLowerCase()

  if (normalized.includes("refrig")) return "refrigerating"
  if (normalized.includes("online") || normalized.includes("on-line")) return "on-line"
  if (normalized.includes("degel") || normalized.includes("defrost")) return "defrosting"
  if (normalized.includes("drenag") || normalized.includes("drain")) return "draining"
  if (normalized.includes("fan")) return "fan-only"
  if (normalized.includes("alarm") || normalized.includes("alarme")) return "alarm"
  if (normalized.includes("off") || normalized.includes("deslig")) return "off"
  if (normalized.includes("idle") || normalized.includes("aguard")) return "idle"

  return "idle"
}

export function getOperationalStatusBadge(status: OperationalStatus) {
  switch (status) {
    case "refrigerating":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
          <Snowflake className="size-3 animate-spin" style={{ animationDuration: "2s" }} />
          <span>Refrigeração</span>
        </Badge>
      )
    case "on-line":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <Power className="size-3" />
          <span>Em Operação</span>
        </Badge>
      )
    case "defrosting":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
          <Snowflake className="size-3" />
          <span>Degelo</span>
        </Badge>
      )
    case "draining":
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1">
          <Waves className="size-3" />
          <span>Drenagem</span>
        </Badge>
      )
    case "fan-only":
      return (
        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center gap-1">
          <Fan className="size-3 animate-spin" style={{ animationDuration: "3s" }} />
          <span>Ventilação</span>
        </Badge>
      )
    case "idle":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
          <Clock className="size-3" />
          <span>Standby</span>
        </Badge>
      )
    case "alarm":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 animate-pulse">
          <AlertTriangle className="size-3" />
          <span>Alarme</span>
        </Badge>
      )
    case "off":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
          <Power className="size-3" />
          <span>Desligado</span>
        </Badge>
      )
    default:
      return null
  }
}
