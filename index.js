var chokidar = require('chokidar')
var path = require('path')

var d = require('debug')('watch-test')

module.exports = TestWatcher

function TestWatcher(opts) {
  if (!(this instanceof TestWatcher))
    return new TestWatcher

  // Dependencies map like {module: [depended from...]}
  this.depsMap = {}

  // TODO parameterize
  this.excludePatterns = [
    /\/node_modules\//
  ]

  // TODO parameterize
  this.testModulePatterns = [
    /test-.+\.js/
  ]

  // TODO parameterize
  this.testModules = [
    './test/fixture/test/test-b',
    './test/fixture/test/test-c'
  ]

  this.watcher = chokidar
    .watch()
    .on('change', this.run)
}

TestWatcher.prototype.add = function() {
  d('TestWatcher#add')
}

TestWatcher.prototype.addHook = function() {
  d('TestWatcher#addHook')
  var self = this

  var Module = module.constructor
  var originalLoad = Module._load
  Module._load = function(request, parent) {
    d('loading module...')
    d('  request: ', request)
    d('  parent: ', parent.id)
    if (!self.excludePatterns.some(p => p.test(parent.id))) {
      let id
      try {
        id = require.resolve(request)
      } catch (e) {
        id = require.resolve(path.resolve(path.dirname(parent.id), request))
      }
      if (!self.excludePatterns.some(p => p.test(id))) {
        self.depsMap[id] = self.depsMap[id] || []
        self.depsMap[id].push(parent.id)
        d('  cache dependencies of "' + parent.id + '"')
      }
    }
    return originalLoad.apply(this, arguments)
  }
}

TestWatcher.prototype.run = function(changed) {
  d('TestWatcher#run')
  var self = this
  if (changed)
    throw new Error('not implemented')
  else
    this.testModules.forEach(function(t) {
      require(t)
      self.watcher.add(Object.keys(self.depsMap))
      console.log(Object.keys(self.depsMap))
    })
}

// TODO integrate to `run` method
/* TestWatcher.prototype.rerun = function(file) {
 *   d('rerun', file)
 *   console.log(Object.keys(require.cache).filter(c => !/node_modules/.test(c)))
 *   console.log(Object.keys(require.cache).filter(c => /tape/.test(c)))
 *   d('deleting cache of test modules...')
 *   testModules.forEach(m => {
 *     delete(require.cache[m])
 *   })
 *   d('deleting cache of test runnner modules...')
 *   Object.keys(require.cache).filter(c => /tape/.test(c)).forEach(m => {
 *     delete(require.cache[m])
 *   })
 *   console.log(Object.keys(require.cache).filter(c => !/node_modules/.test(c)))
 *   console.log(Object.keys(require.cache).filter(c => /tape/.test(c)))
 *   d('re-require test module')
 *   _findTestsToRerun(file).forEach(m => {
 *     require(m)
 *   })
 * }*/

// TODO find test entry which depends changed file
TestWatcher.prototype._findTestsToRerun = function(changed, acc) {
  d('_findTestsToRerun', changed, acc)
  /* acc = acc || []
   * changed = Array.isArray(changed) ? changed : [changed]
   * changed.forEach(function(c) {
   *   if (entries.includes(c)) {
   *     acc.push(c)
   *   } else {
   *     _walkToEntries(res.depends(c), acc)
   *   }
   * })
   * console.log(acc)
   * return acc*/
  return this.testModules
}
