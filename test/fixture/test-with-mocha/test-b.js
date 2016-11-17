var assert = require('assert')

var b = require('../b')

describe('b', function() {
  it('b() should return "b"', function() {
    assert.equal(b(), 'b')
  })
})
