import type { InstrumentWithValues } from "../types";
import { convertToNumber } from "./convert-to-number";
import { PROCESS_STATUS_MAP } from "./process-status";

type ProcessStatusMap = {
  id: number;
  name: string;
  modelId?: number | null | undefined;
  error?: string | undefined;
} & Partial<Omit<InstrumentWithValues, "id" | "name" | "modelId" | "error">>

export function getProcessStatus(instrument: ProcessStatusMap): string {

  const text =
    typeof instrument.ProcessStatusText === 'string'
      ? instrument.ProcessStatusText.trim()
      : ''

  if (text) return text

  const numericStatus = convertToNumber(instrument.ProcessStatus)

  if (numericStatus !== undefined) {
    return PROCESS_STATUS_MAP[numericStatus] ?? String(numericStatus)
  }

  return ''
}