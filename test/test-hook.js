var test = require('tape')

var TapeWatcher = require('../')
var relativify = require('./utils').relativify

var cwd = process.cwd()

test('TapeWatcher#addHook should store dependencies map and test modules excluding by `**/node_modules/**` by defaults (1)', function(t) {
  var watcher = new TapeWatcher()
  watcher.addHook()
  watcher.add(['./test/fixture/test/test-b.js'])
  watcher.start()

  t.deepEqual(relativify(watcher._depsMap, cwd),
    { 'test/fixture/b.js': [ 'test/fixture/test/test-b.js' ],
      'test/fixture/test/test-b.js': [ 'index.js' ] }
  )
  t.deepEqual(relativify(watcher._tests, cwd),
    [ 'test/fixture/test/test-b.js' ]
  )

  setTimeout(function() {
    watcher.invalidateAll()
    t.end()
  }, 100)
})

test('TapeWatcher#addHook should store dependencies map and test modules excluding by `**/node_modules/**` by defaults (2)', function(t) {
  var watcher = new TapeWatcher()
  watcher.addHook()
  watcher.add(['./test/fixture/test/test-c.js'])
  watcher.start()

  t.deepEqual(relativify(watcher._depsMap, cwd),
    { 'test/fixture/c-1.js': [ 'test/fixture/c.js' ],
      'test/fixture/c-2-1.js': [ 'test/fixture/c-2.js' ],
      'test/fixture/c-2.js': [ 'test/fixture/c.js' ],
      'test/fixture/c.js': [ 'test/fixture/test/test-c.js' ],
      'test/fixture/test/test-c.js': [ 'index.js' ] }
  )
  t.deepEqual(relativify(watcher._tests, cwd),
    [ 'test/fixture/test/test-c.js' ]
  )

  setTimeout(function() {
    watcher.invalidateAll()
    t.end()
  }, 100)
})

test('`excludePattern` option should work TapeWatcher#addHook to store dependencies map and test modules', function(t) {
  var watcher = new TapeWatcher({excludePattern: ''})
  watcher.addHook()
  watcher.add(['./test/fixture/test/test-b.js'])
  watcher.start()

  // dependencies of node_modules like `tape` exist
  t.deepEqual(relativify(watcher._depsMap, cwd)['node_modules/tape/index.js'],
    [ 'test/fixture/test/test-b.js', 'index.js' ]
  )
  t.deepEqual(relativify(watcher._tests, cwd),
    [ 'test/fixture/test/test-b.js' ]
  )

  setTimeout(function() {
    watcher.invalidateAll()
    t.end()
  }, 100)
})
