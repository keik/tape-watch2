var test = require('tape')

var touch = require('touch')

var TestWatcher = require('../')
var relativify = require('./utils').relativify

var cwd = process.cwd()

test('TestWatcher should watch changes of files and re-run on changed', function(t) {
  var watcher = new TestWatcher()
  watcher.addHook()
  watcher.add(['./test/fixture/test/test-c.js'])
  watcher.start()

  // no modules are stored as dependencies because all required modules are as `testModules` by pattern '**'
  t.deepEqual(relativify(watcher._depsMap, cwd),
    { 'test/fixture/c-1.js': [ 'test/fixture/c.js' ],
      'test/fixture/c-2-1.js': [ 'test/fixture/c-2.js' ],
      'test/fixture/c-2.js': [ 'test/fixture/c.js' ],
      'test/fixture/c.js': [ 'test/fixture/test/test-c.js' ],
      'test/fixture/test/test-c.js': [ 'index.js' ] }
  )
  // all required module are as `testModules`
  t.deepEqual(relativify(watcher._tests, cwd),
    [ 'test/fixture/test/test-c.js' ]
  )

  function _test() {
    t.is(
      watcher._tests.length,
      1,
      'test count should be 1')

    t.deepEqual(
      Object.keys(watcher._watcher),
      Object.keys(watcher._depsMap),
      'watching modules should be on only dependencies of tests')
  }

  Promise.resolve().then(function() {
    return new Promise(function(resolve) {
      // touch after 1s
      setTimeout(function() {
        touch.sync('./test/fixture/c-2-1.js')
        _test()
        resolve()
      }, 1000)
    })
  }).then(function() {
    return new Promise(function(resolve) {
      // touch after 1s
      setTimeout(function() {
        touch.sync('./test/fixture/c-2-1.js')
        _test()
        resolve()
      }, 1000)
    })
  }).then(function() {
    // end test after 1s
    setTimeout(function() {
      _test()
      watcher.invalidateAll()
      t.end()
    }, 1000)
  }).catch(function(e) {
    t.fail(e)
    console.error(e)
    watcher.invalidateAll()
    t.end()
  })
})
