var test = require('tape')

var concat = require('concat-stream')
var fs = require('fs')
var spawn = require('child_process').spawn

test('`watch-test` with no options should show usage', function(t) {
  spawn('./bin/watch-test').stdout
    .pipe(concat(function(buf) {
      fs.readFile('./bin/usage', function(e, data) {
        if (e) throw new Error(e)
          t.is(buf.toString(), data.toString())
        t.end()
      })
    }))
})

test('`watch-test` with `-h` options should show usage', function(t) {
  spawn('./bin/watch-test', ['-h', 'foo', 'bar']).stdout
    .pipe(concat(function(buf) {
      fs.readFile('./bin/usage', function(e, data) {
        if (e) throw new Error(e)
          t.is(buf.toString(), data.toString())
        t.end()
      })
    }))
})
