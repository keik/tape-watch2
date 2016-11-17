var test = require('tape')

var touch = require('touch')

var TestWatcher = require('../')
var relativify = require('./utils').relativify

var cwd = process.cwd()

test('`testModulePattern` option should work TestWatcher#addHook to store dependencies map and test modules', function(t) {
  var watcher = new TestWatcher()

  watcher.addHook()
  require('./fixture/test-with-tape/test-c')
  // no modules are stored as dependencies because all required modules are as `testModules` by pattern '**'
  t.deepEqual(relativify(watcher.depsMap, cwd),
    { 'test/fixture/c-1.js': [ 'test/fixture/c.js' ],
      'test/fixture/c-2-1.js': [ 'test/fixture/c-2.js' ],
      'test/fixture/c-2.js': [ 'test/fixture/c.js' ],
      'test/fixture/c.js': [ 'test/fixture/test-with-tape/test-c.js' ] }
  )
  // all required module are as `testModules`
  t.deepEqual(relativify(watcher.testModules, cwd),
    [ 'test/fixture/test-with-tape/test-c.js' ]
  )
  new Promise(function(resolve) {
    setTimeout(function() {
      touch.sync('./test/fixture/c-2-1.js')
      resolve()
    }, 1000)
  }).then(function() {
    setTimeout(function() {
      watcher.invalidateAll()
    }, 1000)
  })
  t.end()
})

test.onFinish(function() {
  process.stdout.write = function() {}
})
