#!/usr/bin/env node
/*jshint asi:true*/

////////////////////////////////////////////////////////////////////////////////

process.on('uncaughtException', function cleanupAndCrash(error){
  console.error(error.stack)
  driApp.emit('die')
  setTimeout(function(){
    process.exit(1)
  }, 1000);
})

////////////////////////////////////////////////////////////////////////////////

var fs = require('fs')
var path = require('path')
var util = require('util')
var request = require('request')
var connect = require('connect')
var util = require('util')
var Herd = require('hook.io-herd').Herd
var observableObject = require('../SharedSupport/lib/observable-object')
var webview = require('../SharedSupport/lib/webview').webview
var exec = require('child_process').exec
var execFile = require('child_process').execFile

////////////////////////////////////////////////////////////////////////////////

var CocoaDialog = {
  bin: process.env.CocoaDialog,
  args: [
    "--icon-file", process.env.App + "/Contents/Resources/Dri.icns",
    // "--title", "Missing Dependency",
    // "--text", "$DYLD_FRAMEWORK_PATH cannot be found",
    // "--informative-text", "The WebKit Inspector depends on WebKit Nightly",
    // "--button1", "Launch without Inspector",
    // "--button2", "Get WebKit Nightly",
    // "--button3", "Cancel & Quit",
    "--timeout", 30
  ],
  exec:function(args, callback){
    execFile(this.bin, args.concat(this.args), callback)
  }
}

////////////////////////////////////////////////////////////////////////////////

var preferences = {
  constructor:function(config){
    this.path = config.path
    this.model = config.model
    
    this.load()
  },
  path: null,
  data: null,
  load:function(){
    this.data = {}
    try {
      this.data = require(this.path)
    }
    catch(e){
      console.error('driApp.preferences.load', this.path, e)
      this.save()
    }
  },
  save:function(callback){
    fs.writeFile(this.path, JSON.stringify(this.data, null, 2), callback)
  },
  get: function(key, defaultValue){
    if (key in this.data){
      this.model.set(key, this.data[key])
      return this.data[key]
    }
    else {
      this.model.set(key, defaultValue)
      return defaultValue
    }
  },
  set: function(key, value){
    this.data[key] = value
    this.model.set(key, value)
    this.save()
  }
}
preferences.constructor.prototype = preferences

////////////////////////////////////////////////////////////////////////////////

var backendConfig = require('../SharedSupport/Hooks/Android.config.js')
var frontendConfig = {
  "src": require.resolve('../SharedSupport/lib/hook.io-webserver'),
  "name": "frontend",
  "port": 8182,
  "autoheal": false,
  "webroot": process.env.SharedSupport + "/Frontend"
}

////////////////////////////////////////////////////////////////////////////////

var driApp = new Herd({ "name":"Dri.app" })

driApp.on('hook::started', function dieIfAlreadyRunning(){
  if (driApp.name === "Dri.app") return
  throw Error('Looks like multiple versions are running at once')
})

driApp.once('hook::ready', function setupFrontend(){ driApp.spawn([ driApp.childConfigFrom(frontendConfig) ]) })
driApp.once('frontend::loaded', function setupBackend(){ driApp.spawn([ driApp.childConfigFrom(backendConfig) ]) })
  
driApp.once('frontend::loaded', function publishFrontendInfo(){
  driApp.emit('version', util.format("v%s %s", require(process.env.App + '/Contents/package.json').version, process.env.BuildString))
})

driApp.once('frontend::webserver::started', function startWebView(port){
  var ui = webview('http://localhost:' + port)
  ui.once('exit', function(exitCode){
    driApp.emit('ui::exit')
    driApp.emit('die')
  })
  driApp.on('die', function(){
    ui.kill()
  })
  setTimeout(function(){
    driApp.emit('ui::started')
  }, 100);
})

/*
driApp.once('ui::started', function setupAppAssetsServer(){
  var app_assets = driApp.preferences.get('app_assets')
  var app_assets_port = driApp.preferences.get('app_assets_port', 1233)
  
  if (path.existsSync(app_assets)) return initStaticServer(app_assets, app_assets_port)
  
  CocoaDialog.exec([
    "fileselect",
    "--title","Select your 'app_assets' folder",
    "--text","It will hosted it as an http server and `adb forward`",
    // "--informative-text",""
    "--select-only-directories"
  ], function(error, app_assets){
    if (error) return console.error(error);
    app_assets = String(app_assets).trim()
    initStaticServer(app_assets, app_assets_port)
    driApp.preferences.set('app_assets', app_assets)
  })
})
*/

driApp.on('*::adb::disconnected', function(){ driApp.model.set('isConnected', false) })
driApp.on('*::adb::connected', function(){ driApp.model.set('isConnected', true) })

/*
driApp.once('frontend::loaded', function setupCron(){
  driApp.on('isConnected=true', setup)
  if (driApp.model.get('isConnected')) setup()
  function setup(){
    driApp.once('isConnected=false', function teardown(){clearInterval(timer)})
    timer = setInterval(tick, 1000)
  }
  var timer
  function tick(){ driApp.emit('occasion', Date.now()) }
})
*/

////////////////////////////////////////////////////////////////////////////////

process.nextTick(function main(){
  driApp.model = Object.create(observableObject, {
    emit:{writable:false, enumerable:false, configurable:false, value:driApp.emit.bind(driApp)}
  })
  
  driApp.preferences = new preferences.constructor({ model:driApp.model, path:process.env.UserConfig })
  
  driApp.start()
  
  initAvailableSockets(driApp.model)
  
  // initStaticServer(process.env.HOME + '/Sites', 1232)
})

////////////////////////////////////////////////////////////////////////////////

function initAvailableSockets(model){
  
  driApp.on('android-adb-portmap::port::forward::*::on', function(){
    var port = this.event.split('::')[3].split(':')[1]
    
    var interval = setInterval(intervalCallback, 1000)
    function intervalCallback(){
      request('http://localhost:'+port+'/json', function(error, response, body){
        if (error) {
          clearInterval(interval)
          model.set('available-sockets::' + port, null)
          return
        }
        var data = JSON.parse(body)
        model.set('available-sockets::' + port, data)
      })
    }
    intervalCallback()
  })

  getAvailableInspectorSockets.regex = /href="\?page=(\d+)">([^<]*)<\//g

  function getAvailableInspectorSockets(url, callback){
    var regex = getAvailableInspectorSockets.regex
    request(url, function(error, response, body){
      if (error) return callback(error)
      var match, data = [], name
      regex.lastIndex = 0
      while ((match = regex.exec(body))) {
        name = match[2]
        if (name.indexOf('data:') == 0) name = name.substr(0,32) + '...'
        data.push({
          name: name,
          host: response.request.uri.host,
          page: match[1],
          url: util.format('%s/devtools/page/%s', response.request.uri.host, match[1])
        })
      }
      callback(null, data)
    })
  }

}

/*
function initStaticServer(WEBROOT, PORT){
  console.log('initStaticServer', PORT, WEBROOT)
  if (!path.existsSync(WEBROOT)){
    console.error("Path doesn't exist:", WEBROOT)
    return false
  }
  var app = connect()
    .use(connect['static'](WEBROOT))
    .use(connect.directory(WEBROOT))
  
  var data = {port:PORT, webroot:WEBROOT, url:"http://localhost:" + PORT}
  
  app.listen(PORT)
  app.on('error', function(error){
    data.error = error
    driApp.emit('initStaticServer::error', data)
  })
  driApp.emit('static-server::ready', data)
}
*/
