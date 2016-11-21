var chokidar = require('chokidar')
var debug = require('debug')('watch-test')
var defined = require('defined')
var glob = require('glob')
var minimatch = require('minimatch')
var Module = require('module')
var path = require('path')

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
  if (!(this instanceof TapeWatcher))
    return new TapeWatcher

  debug('#TapeWatcher#Ctor', opts)
  opts = opts || {}
  this.verbose = opts.verbose
  this.excludePattern = defined(opts.excludePattern, '**/node_modules/**')

  this._depsMap = {}  // dependencies map like {module: [depended from...]}
  this._tests = []
  this._watcher = {}
  this._stream = process.stdout
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

    // store dependencies
    self._depsMap[id] = self._depsMap[id] || []
    if (self._depsMap[id].indexOf(parent.id) < 0) {
      debug('  stored dependencies of "' + id + '"')
      self._depsMap[id].push(parent.id)
    }

    // add watcher
    if (!self._watcher[id])
      self._watcher[id] = []
    var w = chokidar.watch(id).on('change', self.run.bind(self))
    self._watcher[id].push(w)

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
  var deps = TapeWatcher.findDeps(changed, this._depsMap, this._tests)
  this._watcher[changed].forEach(function(w) {
    w.close()
  })

  var tests = TapeWatcher.findTestsToRerun(changed, this._depsMap, this._tests)
  // retrieve parents of changed dependencies
  this._deleteModuleCache(deps)

  var start = Number(new Date())
  tests.forEach(function(test) {
    require(test)
  })
  this.printWaiting(tests.length, start, Number(new Date))
}

TapeWatcher.prototype._deleteModuleCache = function(changed) {
  debug('TapeWatcher#_deleteModuleCache', changed)
  changed.forEach(function(m) {
    delete(require.cache[m])
    delete(this._depsMap[m])
  }.bind(this))
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
  Object.keys(this._watcher).forEach(function(k) {
    this._watcher[k].forEach(function(w) {
      setTimeout(function() {
        w.close()
      }, 100)  // if to watch and close sequential, it occurs to remain process
    })
  }.bind(this))
  this._watcher = {}

  // clear cache
  Object.keys(require.cache).forEach(function(key) {
    delete require.cache[key]
  })
}

TapeWatcher.prototype.printWaiting = function(tcount, start, end) {
  if (this.verbose)
    setTimeout(function() {
      this._stream.write('\n' + tcount + ' tests done in ' + ((end - start) / 1000).toFixed(2) + ' seconds')
      this._stream.write('\nwaiting to change files...\n')
    }.bind(this), 100)
}

/**
 * Find and return test modules to re-run from all test modules
 * by traversing dependencies tree from changed files.
 *
 * @param {array<string>|string} changed - change file name (or names)
 * @param {object} depsMap - dependencies map like {module: [depended from...]}
 * @param {array<string>} tests - test module names
 */
TapeWatcher.findTestsToRerun = function(changed, depsMap, tests, acc) {
  debug('TapeWatcher.findTestsToRerun', changed)
  acc = acc || []
  changed = Array.isArray(changed) ? changed : [changed]
  changed.forEach(function(c) {
    if (tests.indexOf(c) >= 0) {
      acc.push(c)
    } else {
      if (depsMap[c])
        TapeWatcher.findTestsToRerun(depsMap[c], depsMap, tests, acc)
    }
  }.bind(this))
  return acc
}

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
