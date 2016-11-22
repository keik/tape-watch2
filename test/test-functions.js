var test = require('tape')

var TestWatcher = require('../')

test('TestWatcher.findDeps() should return test entries on dependencies of the changed file', function(t) {
  var testModules = [
    '/path/to/src/test/test-b.js',
    '/path/to/src/test/test-c-1.js',
    '/path/to/src/test/test-c-2-1.js',
    '/path/to/src/test/test-c-2.js',
    '/path/to/src/test/test-c.js'
  ]
  var depsMap = {
    '/path/to/src/b.js': [
      '/path/to/src/test/test-b.js'
    ],
    '/path/to/src/test/test-b.js': [
      '.'
    ],
    '/path/to/src/c-1.js': [
      '/path/to/src/test/test-c-1.js',
      '/path/to/src/c.js'
    ],
    '/path/to/src/test/test-c-1.js': [
      '.'
    ],
    '/path/to/src/c-2-1.js': [
      '/path/to/src/test/test-c-2-1.js',
      '/path/to/src/c-2.js'
    ],
    '/path/to/src/test/test-c-2-1.js': [
      '.'
    ],
    '/path/to/src/c-2.js': [
      '/path/to/src/test/test-c-2.js',
      '/path/to/src/c.js'
    ],
    '/path/to/src/test/test-c-2.js': [
      '.'
    ],
    '/path/to/src/c.js': [
      '/path/to/src/test/test-c.js'
    ],
    '/path/to/src/test/test-c.js': [
      '.'
    ]
  }

  t.deepEqual(TestWatcher.findDeps('/path/to/src/c-2-1.js', depsMap, testModules),
    [
      '/path/to/src/c-2-1.js',
      '/path/to/src/test/test-c-2-1.js',
      '/path/to/src/c-2.js',
      '/path/to/src/test/test-c-2.js',
      '/path/to/src/c.js',
      '/path/to/src/test/test-c.js'
    ]
  )
  t.end()
})
