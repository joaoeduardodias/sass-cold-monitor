import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { roleSchema } from './role'

describe('roleSchema', () => {
  it('accepts supported roles', () => {
    assert.equal(roleSchema.parse('ADMIN'), 'ADMIN')
    assert.equal(roleSchema.parse('OPERATOR'), 'OPERATOR')
    assert.equal(roleSchema.parse('VIEWER'), 'VIEWER')
    assert.equal(roleSchema.parse('EDITOR'), 'EDITOR')
  })

  it('rejects unsupported roles', () => {
    assert.equal(roleSchema.safeParse('OWNER').success, false)
  })
})
