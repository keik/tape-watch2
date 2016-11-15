var test = require('tape')

var c_2 = require('../c-2')

test('c_2() should return "c-2"', function(t) {
  t.is(c_2(), 'c-2 c-2-1')
  t.end()
})
