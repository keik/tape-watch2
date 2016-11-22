var test = require('tape')

var concat = require('concat-stream')
var fs = require('fs')
var spawn = require('child_process').spawn
var through = require('through2')

test('`tape-watch` with no options should show usage', function(t) {
  spawn('./bin/tape-watch').stdout
    .pipe(concat(function(buf) {
      fs.readFile('./bin/usage', function(e, data) {
        if (e) throw new Error(e)
          t.is(buf.toString(), data.toString())
        t.end()
      })
    }))
})

test('`tape-watch` with `-h` options should show usage', function(t) {
  spawn('./bin/tape-watch', ['-h', 'foo', 'bar']).stdout
    .pipe(concat(function(buf) {
      fs.readFile('./bin/usage', function(e, data) {
        if (e) throw new Error(e)
        t.is(buf.toString(), data.toString())
        t.end()
      })
    }))
})

test('`tape-watch` with `-v` options should output verbose messages', function(t) {
  var ps = spawn('./bin/tape-watch', ['-v', './test/fixture/test/test-b.js'])
  ps.stdout.pipe(through()).on('data', function(data) {
    if (RegExp('waiting to change files...').test(data.toString())) {
      ps.kill()
      t.end()
    }
  })
})
