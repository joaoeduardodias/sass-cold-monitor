import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getInitials } from './get-initials'

describe('getInitials', () => {
  it('returns up to two uppercase initials', () => {
    assert.equal(getInitials('Joao Silva Pereira'), 'JS')
  })

  it('keeps a single initial for one-word names', () => {
    assert.equal(getInitials('maria'), 'M')
  })
})
