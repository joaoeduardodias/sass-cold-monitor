export type AlertLevel = 'normal' | 'warning' | 'critical'

export function evaluateAlertLevel(params: {
  value: number
  minValue: number
  maxValue: number
}): AlertLevel {
  const { value, minValue, maxValue } = params

  if (value <= minValue || value >= maxValue) {
    return 'critical'
  }

  const range = Math.max(0, maxValue - minValue)
  const warningMargin = range * 0.1

  if (value <= minValue + warningMargin || value >= maxValue - warningMargin) {
    return 'warning'
  }

  return 'normal'
}

export function getNearestLimit(params: {
  value: number
  minValue: number
  maxValue: number
}) {
  const { value, minValue, maxValue } = params
  const distanceToMin = Math.abs(value - minValue)
  const distanceToMax = Math.abs(value - maxValue)
  return distanceToMin <= distanceToMax ? minValue : maxValue
}

