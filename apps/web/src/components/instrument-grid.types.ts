export type OperationalStatus = "refrigerating" | "defrosting" | "idle" | "alarm" | "fan-only" | "off"

export type InstrumentStatus = "normal" | "warning" | "critical"

export type Instrument = {
  id: string
  name: string
  type: "TEMPERATURE" | "PRESSURE"
  temperature: number | null
  pressure: number | null
  setpoint: number | null
  differential: number | null
  min: number
  max: number
  status: InstrumentStatus
  operationalStatus: OperationalStatus
  lastUpdated: string | null
}

export type DashboardWsMessage =
  | {
    type: "INSTRUMENT_UPDATE"
    payload: {
      instrumentId: string
      value: number
      editValue: number
      temperature?: number | null
      pressure?: number | null
      setpoint?: number | null
      differential?: number | null
      updatedAt: string
    }
  }
  | {
    type: "ALERT_NOTIFICATION"
    payload: {
      instrumentId: string
      chamberName: string
      alertType: "warning" | "critical"
      currentValue: string
      limitValue: string
      timestamp: string
    }
  }
