var assert = require('assert')

var c_1 = require('../c-1')

describe('c-1', function() {
  it('c_1() should return "c-1"', function() {
    assert.equal(c_1(), 'c-1')
  })
})
