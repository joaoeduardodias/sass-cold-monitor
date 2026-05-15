import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { convertToNumber } from './convert-to-number'

describe('convertToNumber', () => {
  it('returns finite numbers unchanged', () => {
    assert.equal(convertToNumber(12.5), 12.5)
  })

  it('parses decimal strings with dot or comma separators', () => {
    assert.equal(convertToNumber('12.5'), 12.5)
    assert.equal(convertToNumber('12,5'), 12.5)
  })

  it('rejects invalid or infinite values', () => {
    assert.equal(convertToNumber('abc'), undefined)
    assert.equal(convertToNumber(Number.POSITIVE_INFINITY), undefined)
    assert.equal(convertToNumber(null), undefined)
  })
})
