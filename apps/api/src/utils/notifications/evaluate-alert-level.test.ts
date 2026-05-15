import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { evaluateAlertLevel, getNearestLimit } from './evaluate-alert-level'

describe('evaluateAlertLevel', () => {
  it('returns critical at or outside configured limits', () => {
    assert.equal(
      evaluateAlertLevel({ value: 0, minValue: 0, maxValue: 10 }),
      'critical',
    )
    assert.equal(
      evaluateAlertLevel({ value: 10, minValue: 0, maxValue: 10 }),
      'critical',
    )
  })

  it('returns warning inside the 10 percent limit margin', () => {
    assert.equal(
      evaluateAlertLevel({ value: 1, minValue: 0, maxValue: 10 }),
      'warning',
    )
    assert.equal(
      evaluateAlertLevel({ value: 9, minValue: 0, maxValue: 10 }),
      'warning',
    )
  })

  it('returns normal away from the limits', () => {
    assert.equal(
      evaluateAlertLevel({ value: 5, minValue: 0, maxValue: 10 }),
      'normal',
    )
  })
})

describe('getNearestLimit', () => {
  it('returns the closest configured limit', () => {
    assert.equal(getNearestLimit({ value: 2, minValue: 0, maxValue: 10 }), 0)
    assert.equal(getNearestLimit({ value: 8, minValue: 0, maxValue: 10 }), 10)
  })
})
