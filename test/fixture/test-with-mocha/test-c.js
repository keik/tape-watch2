var assert = require('assert')

var c = require('../c')

describe('c', function() {
  it('c() should return "c"', function() {
    assert.equal(c(), 'c c-1 c-2 c-2-1')
  })
})
