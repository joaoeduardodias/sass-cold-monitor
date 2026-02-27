export type OperationalStatus = "refrigerating" | "on-line" | "defrosting" | "draining" | "idle" | "alarm" | "fan-only" | "off"

export type InstrumentStatus = "normal" | "warning" | "critical"
export type InstrumentType = "TEMPERATURE" | "PRESSURE"

export type Instrument = {
  id: string
  idSitrad: number | null
  name: string
  slug: string
  model: number
  type: InstrumentType
  organizationId: string
  min: number
  max: number
  value: number | null
  status: InstrumentStatus
  operationalStatus: OperationalStatus
  error: boolean
  isSensorError: boolean
  isFan: boolean
  setpoint: number | null
  differential: number | null
  lastUpdated: string | null
}

type InstrumentValuesPayload = {
  instrumentId: string
  idSitrad: number
  name: string
  slug: string
  model: number
  type: InstrumentType
  organizationId: string
  value: number
  status: string
  isFan: boolean
  error: boolean
  isSensorError: boolean
  setPoint: number
  differential: number
}

type InstrumentUpdatePayload = {
  instrumentId: string
  idSitrad: number
  name: string
  slug: string
  model: number
  type: InstrumentType
  status: string
  isFan: boolean
  isSensorError: boolean
  value: number
  editValue: number
  minValue: number
  maxValue: number
  setpoint: number
  differential: number
  updatedAt: string
}

export type DashboardWsMessage =
  | {
    type: "INSTRUMENT_VALUES"
    payload: InstrumentValuesPayload[]
  }
  | {
    type: "INSTRUMENT_UPDATE"
    payload: InstrumentUpdatePayload
  }
  | {
    type: "ALERT_NOTIFICATION"
    payload: {
      instrumentId: string
      instrumentName: string
      alertType: "warning" | "critical"
      currentValue: number
      limitValue: number
      timestamp: string
    }
  }
