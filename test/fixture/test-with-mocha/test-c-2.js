var assert = require('assert')

var c_2 = require('../c-2')

describe('c-2', function() {
  it('c_2() should return "c-2 c-2-1"', function() {
    assert.equal(c_2(), 'c-2 c-2-1')
  })
})
