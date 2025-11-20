import { env } from '@cold-monitor/env'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(timezone)
const TIMEZONE = env.TIMEZONE

/**
 * Converte uma data do banco (UTC) para o fuso UTC-3 (visualmente)
 */
export function convertToLocal(date: Date | string): dayjs.Dayjs {
  return dayjs.utc(date).tz(TIMEZONE)
}

/**
 * Converte uma data no fuso UTC-3 para UTC (para salvar no banco)
 */
export function convertToUTC(date: Date | string): Date {
  return dayjs.tz(date, TIMEZONE).utc().toDate()
}
