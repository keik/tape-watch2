var test = require('tape')

var c_2_1 = require('../c-2-1')

test('c_2_1() should return "c-2-1"', function(t) {
  t.is(c_2_1(), 'c-2-1')
  t.end()
})
