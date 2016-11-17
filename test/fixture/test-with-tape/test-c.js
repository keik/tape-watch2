var test = require('tape')

var c = require('../c')

test('c() should return "c"', function(t) {
  t.is(c(), 'c c-1 c-2 c-2-1')
  t.end()
})
