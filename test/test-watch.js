var test = require('tape')

var join = require('path').join
var fork = require('child_process').fork
var Module = require('module')
var relative = require('path').relative
var touch = require('touch')

var TestWatcher = require('../')
var relativify = require('./utils').relativify

var load = Module._load
var cwd = process.cwd()

test('`testModulePattern` option should work TestWatcher#addHook to store dependencies map and test modules', function(t) {
  var watcher = new TestWatcher()

  watcher.addHook()
  require('./fixture/test/test-c')
  // no modules are stored as dependencies because all required modules are as `testModules` by pattern '**'
  t.deepEqual(relativify(watcher.depsMap, cwd),
    { 'test/fixture/c-1.js': [ 'test/fixture/c.js' ],
      'test/fixture/c-2-1.js': [ 'test/fixture/c-2.js' ],
      'test/fixture/c-2.js': [ 'test/fixture/c.js' ],
      'test/fixture/c.js': [ 'test/fixture/test/test-c.js' ] }
  )
  // all required module are as `testModules`
  t.deepEqual(relativify(watcher.testModules, cwd),
    [ 'test/fixture/test/test-c.js' ]
  )
  new Promise(function(resolve) {
    setTimeout(function() {
      touch.sync('./test/fixture/c-2-1.js')
      resolve()
    }, 100)
  }).then(function() {
    setTimeout(function() {
      watcher.invalidateAll()
    }, 1000)
  })
  t.end()
})

test.onFinish(function(a,b,c) {
  process.stdout.write = function() {}
})
