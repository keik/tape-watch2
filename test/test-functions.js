var test = require('tape')

var TestWatcher = require('../')

test('TestWatcher.findTestsToRerun() should return test entries on dependencies of the changed file', t => {
  var testModules = [
    '/Users/keik/work/products/watch-test/test/fixture/test/test-b.js',
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c-1.js',
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2-1.js',
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2.js',
    '/Users/keik/work/products/watch-test/test/fixture/test/test-c.js'
  ]
  var depsMap = {
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

  t.deepEqual(TestWatcher.findTestsToRerun('/Users/keik/work/products/watch-test/test/fixture/c-2-1.js', depsMap, testModules),
    [
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2-1.js',
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c-2.js',
      '/Users/keik/work/products/watch-test/test/fixture/test/test-c.js'
    ]
  )
  t.end()
})
