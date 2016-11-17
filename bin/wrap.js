var sw = require('spawn-wrap')

var TestWatcher = require('../')

var testWatcher = new TestWatcher(JSON.parse(process.env.OPTS))
testWatcher.addHook()

sw.runMain()
