import { convertToLocal } from './date-timezone-converter'

export function formatEmailDateTime(value: Date | string | number): string {
  const dateInput = typeof value === 'number' ? new Date(value) : value
  const localDate = convertToLocal(dateInput)

  if (!localDate.isValid()) {
    return 'Data inválida'
  }

  return localDate.format('DD/MM/YYYY - HH:mm')
}

