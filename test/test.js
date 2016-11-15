var test = require('tape')

var TestWatcher = require('../')

test('TestWatcher.prototype._findTestsToRerun() should return test entries on dependencies of the changed file', t => {
  var testWatcher = new TestWatcher()
  testWatcher.testModules = [
    '/Users/keik/work/products/watch-test/test/fixture/test/test-b.js',
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c-1.js',
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2-1.js',
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2.js',
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c.js'
  ]
  testWatcher.depsMap = {
    '/Users/keik/work/products/watch-test/test/fixture/b.js': [
      '/Users/keik/work/products/watch-test/test/fixture/test/test-b.js'
    ],
    '/Users/keik/work/products/watch-test/test/fixture/test/test-b.js': [
      '.'
    ],
    '/Users/keik/work/products/watch-test/test/fixture/c-1.js': [
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c-1.js',
      '/Users/keik/work/products/watch-test/test/fixture/c.js'
    ],
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c-1.js': [
      '.'
    ],
    '/Users/keik/work/products/watch-test/test/fixture/c-2-1.js': [
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2-1.js',
      '/Users/keik/work/products/watch-test/test/fixture/c-2.js'
    ],
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2-1.js': [
      '.'
    ],
    '/Users/keik/work/products/watch-test/test/fixture/c-2.js': [
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2.js',
      '/Users/keik/work/products/watch-test/test/fixture/c.js'
    ],
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2.js': [
      '.'
    ],
    '/Users/keik/work/products/watch-test/test/fixture/c.js': [
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c.js'
    ],
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c.js': [
      '.'
    ]
  }

  t.deepEqual(testWatcher._findTestsToRerun('/Users/keik/work/products/watch-test/test/fixture/c-2-1.js'),
    [
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2-1.js',
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2.js',
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c.js'
    ]
  )
  t.end()
})
