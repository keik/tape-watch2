const path = require('path')

const Module = module.constructor
const originalLoad = Module._load
const deps = {}

Module._load = function(request, parent) {
  const id = path.join(path.dirname(parent.id), request) + '.js'
  deps[id] = deps[id] || []
  deps[id].push(parent.id)
  return originalLoad.apply(this, arguments)
}

// const oldExtension = require.extensions['.js'];
// require.extensions['.js'] = function(module, filename) {
//    const oldCompile = module._compile;
//   module._compile = function(code, filename) {
//     code = myTransform(code);
//     module._compile = oldCompile;
//     module._compile(code, filename);
//   };
//   oldExtension(module, filename);
// };

require('./test/fixture/a')

console.log(deps)
