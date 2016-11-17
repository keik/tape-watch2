var relative = require('path').relative

/**
 * Convert paths as key or value of input object to relative path from cwd
 */
module.exports = {
  relativify: function(t, cwd) {
    if (Array.isArray(t)) {
      t = Object.assign([], t)
      return t.map(function(v) {
        return relative(cwd, v)
      })
    }

    t = Object.assign({}, t)
    Object.keys(t).forEach(function(k) {
      t[relative(cwd, k)] = t[k].map(function(v) {
        return relative(cwd, v)
      })
      delete(t[k])
    })
    return t
  }
}
