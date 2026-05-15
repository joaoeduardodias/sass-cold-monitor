import { describe, expect, it } from 'vitest'

import { evaluateAlertLevel, getNearestLimit } from './evaluate-alert-level'

describe('evaluateAlertLevel', () => {
  it('returns critical at or outside configured limits', () => {
    expect(evaluateAlertLevel({ value: 0, minValue: 0, maxValue: 10 })).toBe(
      'critical',
    )
    expect(evaluateAlertLevel({ value: 10, minValue: 0, maxValue: 10 })).toBe(
      'critical',
    )
  })

  it('returns warning inside the 10 percent limit margin', () => {
    expect(evaluateAlertLevel({ value: 1, minValue: 0, maxValue: 10 })).toBe(
      'warning',
    )
    expect(evaluateAlertLevel({ value: 9, minValue: 0, maxValue: 10 })).toBe(
      'warning',
    )
  })

  it('returns normal away from the limits', () => {
    expect(evaluateAlertLevel({ value: 5, minValue: 0, maxValue: 10 })).toBe(
      'normal',
    )
  })
})

describe('getNearestLimit', () => {
  it('returns the closest configured limit', () => {
    expect(getNearestLimit({ value: 2, minValue: 0, maxValue: 10 })).toBe(0)
    expect(getNearestLimit({ value: 8, minValue: 0, maxValue: 10 })).toBe(10)
  })
})
