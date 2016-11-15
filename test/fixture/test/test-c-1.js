var test = require('tape')

var c_1 = require('../c-1')

test('c_1() should return "c-1"', function(t) {
  t.is(c_1(), 'c-1')
  t.end()
})
