var test = require('tape')

var concat = require('concat-stream')
var join = require('path').join
var fork = require('child_process').fork
var Module = require('module')
var relative = require('path').relative
var touch = require('touch')

var TestWatcher = require('../')

var load = Module._load
var cwd = process.cwd()

/**
 * Convert paths as key or value of input object to relative path from cwd
 */
function relativify(t) {
  if (Array.isArray(t)) {
    return t.map(function(v) {
      return relative(cwd, v)
    })
  }

  Object.keys(t).forEach(function(k) {
    t[relative(cwd, k)] = t[k].map(function(v) {
      return relative(cwd, v)
    })
    delete(t[k])
  })
  return t
}

test('TestWatcher#addHook should store dependencies map and test modules excluding by `**/node_modules/**` by defaults', function(t) {
  var watcher = new TestWatcher()

  // 1
  watcher.invalidateAll()
  watcher.addHook()
  require('./fixture/test/test-b')
  t.deepEqual(relativify(watcher.depsMap),
    { 'test/fixture/b.js': [ 'test/fixture/test/test-b.js' ] }
  )
  t.deepEqual(relativify(watcher.testModules),
    [ 'test/fixture/test/test-b.js' ]
  )

  // 2
  watcher.invalidateAll()
  watcher.addHook()
  require('./fixture/test/test-c')
  t.deepEqual(relativify(watcher.depsMap),
    { 'test/fixture/c-1.js': [ 'test/fixture/c.js' ],
      'test/fixture/c-2-1.js': [ 'test/fixture/c-2.js' ],
      'test/fixture/c-2.js': [ 'test/fixture/c.js' ],
      'test/fixture/c.js': [ 'test/fixture/test/test-c.js' ] }
  )
  t.deepEqual(relativify(watcher.testModules),
    [ 'test/fixture/test/test-c.js' ]
  )

  setTimeout(function() {
    watcher.invalidateAll()
  }, 100)
  t.end()
})

test('`excludePattern` option should work TestWatcher#addHook to store dependencies map and test modules', function(t) {
  var watcher = new TestWatcher({excludePattern: ''})

  // 1
  watcher.invalidateAll()
  watcher.addHook()
  require('./fixture/test/test-b')
  // dependencies of node_modules like `tape` exist
  t.deepEqual(relativify(watcher.depsMap)['node_modules/tape/index.js'],
    [ 'test/fixture/test/test-b.js' ]
  )
  t.deepEqual(relativify(watcher.testModules),
    [ 'test/fixture/test/test-b.js' ]
  )
  setTimeout(function() {
    watcher.invalidateAll()
  }, 100)
  t.end()
})

test('`testModulePattern` option should work TestWatcher#addHook to store dependencies map and test modules', function(t) {
  var watcher = new TestWatcher({testModulePattern: '**'})

  // 1
  watcher.invalidateAll()
  watcher.addHook()
  require('./fixture/test/test-c')
  // no modules are stored as dependencies because all required modules are as `testModules` by pattern '**'
  t.deepEqual(relativify(watcher.depsMap),
    {}
  )
  // all required module are as `testModules`
  t.deepEqual(relativify(watcher.testModules),
    [ 'test/fixture/c-1.js', 'test/fixture/c-2-1.js', 'test/fixture/c-2.js', 'test/fixture/c.js', 'test/fixture/test/test-c.js' ]
  )
  setTimeout(function() {
    watcher.invalidateAll()
  }, 100)
  t.end()
})

test.only('TODO watch', function(t) {
  // stdout hack
  var write = process.stdout.write
  var c = concat(function(buf) {
    process.stdout.write = write
    t.is(buf,
      `TAP version 13
# c() should return "c"
ok 1 should be equal
`)
  })
  process.stdout.write = function(buf) {
    c.write.apply(c, arguments)
  }

  var watcher = new TestWatcher()
  watcher.invalidateAll()
  watcher.addHook()
  require('./fixture/test/test-c')

  setTimeout(function() {
    c.end()
    watcher.invalidateAll()
  }, 100)
  t.end()
})
