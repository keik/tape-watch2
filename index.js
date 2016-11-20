var chokidar = require('chokidar')
var debug = require('debug')('watch-test')
var defined = require('defined')
var minimatch = require('minimatch')
var Module = require('module')
var path = require('path')

var cwd = process.cwd()
var _moduleLoad = Module._load

module.exports = TestWatcher

/**
 * @param {object} opts
 * @param {string} opts.verbose - output verbose log to stdout
 * @param {string} opts.excludePattern - ignore `require` hook if `require`d module ID matched to specified pattern
 * @param {string} opts.testModulePattern - store module as "test module" if `require`d module ID matched to specified pattern
 */
function TestWatcher(opts) {
  if (!(this instanceof TestWatcher))
    return new TestWatcher

  opts = opts || {}
  this.verbose = opts.verbose
  this.excludePattern = defined(opts.excludePattern, '**/node_modules/**')
  this.testModulePattern = defined(opts.testModulePattern, 'test/**/test-*')

  this.depsMap = {}  // dependencies map like {module: [depended from...]}
  this.testModules = []
  this._watcher = {}
  this._stream = process.stdout

  if (this.verbose)
    setTimeout(function() {this._stream.write('\nwaiting to change files...\n')}.bind(this), 100)
}

/**
 * Add hook to `require` function to collect test modules and store dependencies tree.
 *
 * If `require`d module ID would match with `excludePattern`, the module ID are ignored from this hook.
 * If `require`d module ID would match with `testModulePattern`, the module ID are stored as test modules.
 */
TestWatcher.prototype.addHook = function() {
  debug('TestWatcher#addHook')

  this.invalidateAll()

  var self = this

  Module._load = function hookedLoad(request, parent) {
    debug('hookedLoad', request)
    var exports = _moduleLoad.apply(this, arguments)

    // start filter to hook
    if (parent == null)
      return exports

    if (minimatch(path.relative(cwd, parent.id), self.excludePattern))
      return exports

    var id
    try {
      id = require.resolve(request)
    } catch (e) {
      try {
        id = require.resolve(path.resolve(path.dirname(parent.id), request))
      } catch (e) {
        return exports
      }
    }

    var parsed = path.parse(id)
    if (parsed.root === '' && parsed.dir === '') // at core module
      return exports

    if (minimatch(path.relative(cwd, id), self.excludePattern))
        return exports
    // end to filter

    // store test modules name
    if (minimatch(path.relative(cwd, id), self.testModulePattern)) {
      if (self.testModules.indexOf(id) < 0) {
        debug('  add to watch "' + id + '"')
        self.testModules.push(id)
      }
      return exports
    }

    // store dependencies
    self.depsMap[id] = self.depsMap[id] || []
    if (self.depsMap[id].indexOf(parent.id) < 0) {
      debug('  stored dependencies of "' + id + '"')
      self.depsMap[id].push(parent.id)
    }

    // add watcher
    if (!self._watcher[id])
      self._watcher[id] = []
    var w = chokidar.watch(id).on('change', self.run.bind(self))
    self._watcher[id].push(w)

    return exports
  }
}

TestWatcher.prototype.run = function(changed) {
  debug('TestWatcher#run', changed || '')
  if (changed) {
    this._watcher[changed].forEach(function(w) {
      w.close()
    })
    this._deleteModuleCache()

    TestWatcher.findTestsToRerun(changed, this.depsMap, this.testModules).forEach(_rerun.bind(this))
  } else {
    this.testModules.forEach(_rerun.bind(this))
  }
  if (this.verbose)
    setTimeout(function() {this._stream.write('\nwaiting to change files...\n')}.bind(this), 100)

  function _rerun(test) {
    debug('TestWatcher#__rerun', test)
    require(test)
  }
}

TestWatcher.prototype._deleteModuleCache = function() {
  debug('TestWatcher#_deleteModuleCache')
  this.testModules.forEach(function(m) {
    delete(require.cache[m])
  })
  Object.keys(require.cache)
    .filter(function(c) {
      return /tape/.test(c)
    })
    .forEach(function(m) {
      delete(require.cache[m])
    })
}

TestWatcher.prototype.invalidateAll = function() {
  debug('TestWatcher#invalidateAll')
  Module._load = _moduleLoad
  this.depsMap = {}
  this.testModules = []

  // close watchers
  Object.keys(this._watcher).forEach(function(k) {
    this._watcher[k].forEach(function(w) {
      setTimeout(function() {
        w.close()
      }, 100)  // if to watch and close sequential, it occurs to remain process
    })
  }.bind(this))
  this._watcher = {}

  // clear cache
  Object.keys(require.cache).forEach(function(key) { delete require.cache[key] })
}

/**
 * Find and return test modules to re-run from all test modules
 * by traversing dependencies tree from changed files.
 *
 * @param {array<string>|string} changed - change file name (or names)
 * @param {object} depsMap - dependencies map like {module: [depended from...]}
 * @param {array<string>} allTestModules - test module names
 */
TestWatcher.findTestsToRerun = function(changed, depsMap, allTestModules, acc) {
  debug('TestWatcher.findTestsToRerun', changed, acc)
  acc = acc || []
  changed = Array.isArray(changed) ? changed : [changed]
  changed.forEach(function(c) {
    if (allTestModules.indexOf(c) >= 0) {
      acc.push(c)
    } else {
      if (depsMap[c])
        TestWatcher.findTestsToRerun(depsMap[c], depsMap, allTestModules, acc)
    }
  }.bind(this))
  return acc
}
