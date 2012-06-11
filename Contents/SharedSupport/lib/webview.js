var child_process = require('child_process')
var spawn = child_process.spawn
var execFile = child_process.execFile

exports.webview = function(url){
  var ui
  url += '?_=' + +new Date
  
  process.env.DYLD_FRAMEWORK_PATH = "/Applications/WebKit.app/Contents/Frameworks/10.7"
  ui = spawn(process.env.App +'/Contents/MacOS/webview', [process.env.ProcessSerialNumber, '-url', url])
  
  var DATA = ''
  ui.stdout.on('data', function(data){ DATA += data })
  ui.stderr.on('data', function(data){ DATA += data })
  
  ui.once('exit', function(exitCode){
    if (exitCode) console.error(DATA)
  })
  
  return ui
}
