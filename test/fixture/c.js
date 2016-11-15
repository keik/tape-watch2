var c_1 = require('./c-1')
var c_2 = require('./c-2')

module.exports = function() {
  return 'c' + ' ' + c_1() + ' ' + c_2()
}
