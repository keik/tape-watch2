var relative = require('path').relative
var xtend = require('xtend')

/**
 * Convert paths as key or value of input object to relative path from cwd
 */
module.exports = {
  relativify: function(t, cwd) {
    if (Array.isArray(t)) {
      t = [].concat(t)
      return t.map(function(v) {
        return relative(cwd, v)
      })
    }

    t = xtend({}, t)
    Object.keys(t).forEach(function(k) {
      t[relative(cwd, k)] = t[k].map(function(v) {
        return relative(cwd, v)
      })
      delete(t[k])
    })
    return t
  }
}
