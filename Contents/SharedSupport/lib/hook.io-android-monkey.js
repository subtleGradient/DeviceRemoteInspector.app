#!/usr/bin/env node

////////////////////////////////////////////////////////////////////////////////

if (module.id == '.') process.nextTick(function(){
  new AndroidMonkey({name:'myAndroidMonkey'}).start()
})

////////////////////////////////////////////////////////////////////////////////

var Hook = require('hook.io').Hook
  , util = require('util')
  , execFile = require('child_process').execFile
  , spawn = require('child_process').spawn
  , net = require('net')

var AndroidMonkey = exports.AndroidMonkey = function(config){
  Hook.call(this, config)
  var self = this
  if (!self.bin) self.bin = 'adb'
  if (!self.setupEventName) self.setupEventName = '*::connected'
  if (!self.shouldLifeForever) self.on('connection::end', function(){self.kill()})
  
  function adb(serial, args, callback){
    if (typeof args == 'string') args = args.split(' ')
    return execFile(self.bin, ['-s', serial].concat(args), callback)
  }
  
  var globalMonkeyPort = 7080
  
  self.on('hook::ready', function(){
    self.on(self.setupEventName, setupDevice)
  })
  
  function setupDevice(serial){
    var connected = true
    self.once('*::'+serial+'::connection=false', teardownDevice)
      
    var monkeyPort = ++ globalMonkeyPort
      
    // setup monkey
    adb(serial, 'forward tcp:'+ monkeyPort +' tcp:1080', function(code, out, err){
      if (code) return console.error(code, out, err)
      // console.log(out)
      self.emit('monkey-port', [monkeyPort, serial])
      // self.on('*::' + self.name + '::')
      net.connect(monkeyPort, function onMonkeySocketConnect(){
        var monkeySocket = this, connected = true
        console.log('monkey server open', serial, monkeyPort)
        sendCommand('wake')
        
        self.on('*::monkey::' + serial + '::do', sendCommand)
        monkeySocket.once('close', function(){
          console.log('monkey server close', serial, monkeyPort)
          connected = false;
          self.off('*::monkey::' + serial + '::do', sendCommand)
        })
        
        function sendCommand(data, callback){
          if (!connected) return
          // console.log(serial, 'handling', data)
          monkeySocket.once('data', function(data){
            data = data.toString()
            callback && callback(null, data)
          })
          monkeySocket.write(data + '\n')
        }
      })
    })
    var monkeyProcess = spawn(self.bin, ['-s', serial, 'shell', 'monkey', '--port', 1080])
      
    function teardownDevice(){
      connected = false
      monkeyProcess.kill()
    }
  }
}

util.inherits(AndroidMonkey, Hook)

