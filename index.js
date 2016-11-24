var chokidar = require('chokidar')
var debug = require('debug')('tape-watch')
var defined = require('defined')
var glob = require('glob')
var minimatch = require('minimatch')
var Module = require('module')
var path = require('path')
var resolve = require('resolve').sync

var cwd = process.cwd()
var _moduleLoad = Module._load

module.exports = TapeWatcher

/**
 * @param {object} opts
 * @param {string} opts.verbose - output verbose log to stdout
 * @param {string} opts.excludePattern - ignore `require` hook if `require`d module ID matched to specified pattern
 * @param {string} opts.testModulePattern - store module as "test module" if `require`d module ID matched to specified pattern
 */
function TapeWatcher(opts) {
  debug('#TapeWatcher#Ctor', opts)
  opts = opts || {}
  this.verbose = opts.verbose
  this.excludePattern = defined(opts.excludePattern, '**/node_modules/**')

  this._depsMap = {}  // dependencies map like {module: [depended from...]}
  this._tests = []
  this._watcher = {}
}

/**
 * Add hook to `require` function to collect test modules and store dependencies tree.
 *
 * If `require`d module ID would match with `excludePattern`, the module ID are ignored from this hook.
 */
TapeWatcher.prototype.addHook = function() {
  debug('TapeWatcher#addHook')

  var self = this

  Module._load = function hookedLoad(request, parent) {
    debug('hookedLoad', request)
    var exports = _moduleLoad.apply(this, arguments)

    // -- start filter to hook

    // test whether parent module ID contains excludePattern
    // if (minimatch(path.relative(cwd, parent.id), self.excludePattern))
    //   return exports

    var id
    try {
      id = resolve(request, {basedir: cwd})
    } catch (e) {
      try {
        id = require.resolve(path.resolve(path.dirname(parent.id), request))
      } catch (e) {
        return exports
      }
    }

    // test whether requested module is core module
    var parsed = path.parse(id)
    if (parsed.root === '' && parsed.dir === '')
      return exports

    // test whether requested module ID matches excludePattern
    if (minimatch(path.relative(cwd, id), self.excludePattern))
      return exports

    // test whether parent module ID matches excludePattern
    if (minimatch(parent.id, self.excludePattern))
      return exports

    // -- end to filter

    // store dependencies
    self._depsMap[id] = self._depsMap[id] || []
    if (self._depsMap[id].indexOf(parent.id) < 0) {
      debug('  stored ' + parent.id + ' as dependencies of "' + id + '"')
      self._depsMap[id].push(parent.id)
    }

    // add watcher
    if (!self._watcher[id])
      self._watcher[id] = chokidar.watch(id).on('change', self.run.bind(self))

    return exports
  }
}

TapeWatcher.prototype.add = function(entry) {
  debug('TapeWatcher#add')
  entry = Array.isArray(entry) ? entry : [entry]
  this._tests = entry.reduce(function(acc, e) {
    return acc.concat(glob.sync(e).map(function(p) {
      return path.resolve(process.cwd(), p)
    }))
  }, [])
}

TapeWatcher.prototype.start = function() {
  debug('TapeWatcher#start')
  var start = Number(new Date())
  this._tests.forEach(function(t) {
    require(t)
  })
  this.printWaiting(this._tests.length, start, Number(new Date))
}

TapeWatcher.prototype.run = function(changed) {
  debug('TapeWatcher#run', changed || '')

  // retrieve dependencies of changed
  var deps = TapeWatcher.findDeps(changed, this._depsMap, this._tests)
  this.invalidate(deps)

  var tests = deps.filter(function(id) {
    return this._tests.indexOf(id) > -1
  }.bind(this))

  var start = Number(new Date())
  tests.forEach(function(test) {
    require(test)
  })
  this.printWaiting(this._tests.length, start, Number(new Date))
}

TapeWatcher.prototype.invalidate = function(deps) {
  debug('TapeWatcher#invalidate', deps)
  deps = Array.isArray(deps) ? deps : [deps]
  deps.forEach(function(id) {

    // invalidate watcher of dependencies
    this._watcher[id].close()
    delete(this._watcher[id])

    // invalidate module caches of dependencies
    delete(require.cache[id])

    // invalidate dependencies map
    delete(this._depsMap[id])

  }.bind(this))

  // invalidate module caches of tape
  Object.keys(require.cache)
    .filter(function(c) {
      return /tape/.test(c)
    })
    .forEach(function(m) {
      delete(require.cache[m])
    })
}

TapeWatcher.prototype.invalidateAll = function() {
  debug('TapeWatcher#invalidateAll')
  Module._load = _moduleLoad
  this._depsMap = {}
  this._tests = []

  // close watchers
  Object.keys(this._watcher).forEach(function(id) {
    this._watcher[id].close()
  }.bind(this))
  this._watcher = {}

  // clear cache
  Object.keys(require.cache).forEach(function(key) {
    delete require.cache[key]
  })
}

TapeWatcher.prototype.printWaiting = function(tcount, start, end) {
  debug('TapeWatcher#printWaiting')
  debug('  _watcher', Object.keys(this._watcher))
  debug('  _depsMap', this._depsMap)
  var self = this
  var results = require(resolve('tape', {basedir: process.cwd()})).getHarness()._results
  results.on('done', function() {
    this.close()  // to print stats
    this.closed = false  // hack to avoid duplicated closing
    if (self.verbose) {
      console.log(this.count + ' tests done in ' + ((end - start) / 1000).toFixed(2) + ' seconds')
      console.log('waiting to change files...\n')
    }
  })
}

/**
 * Find and return all modules of dependencies on changed module
 * by traversing dependencies tree until reaching to test modules.
 *
 * @param {array<string>|string} changed - change module ID
 * @param {object} depsMap - dependencies map like {module_id: [depended_from_id...]}
 * @param {array<string>} tests - test module IDs
 */
TapeWatcher.findDeps = function(changed, depsMap, tests, acc) {
  debug('TapeWatcher.findDeps', changed)
  acc = acc || []
  changed = Array.isArray(changed) ? changed : [changed]
  changed.forEach(function(c) {
    acc.push(c)
    if (depsMap[c] && tests.indexOf(c) < 0)
      TapeWatcher.findDeps(depsMap[c], depsMap, tests, acc)
  }.bind(this))
  return acc
}
