var test = require('tape')

var b = require('../b')

test('b() should return "b"', function(t) {
  t.is(true, true)  // #1
  t.is(b(), 'b')    // #2
  t.end()
})
