var test = require('tape')

var b = require('../b')

test('b() should return "b"', function(t) {
  t.is(b(), 'b')
  t.end()
})
