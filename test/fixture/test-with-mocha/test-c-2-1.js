var assert = require('assert')

var c_2_1 = require('../c-2-1')

describe('c', function() {
  it('c() should return "c"', function() {
    assert.equal(c_2_1(), 'c-2-1')
  })
})
