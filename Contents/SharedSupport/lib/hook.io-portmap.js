#!/usr/bin/env node
// Uses `adb forward` and `adb backward` to map local ports to device ports
// Listens for devices to be connected
// Re-configures when the device is re-connected
// Use the config to pre-configure the ports you want mapped

////////////////////////////////////////////////////////////////////////////////

if (module.id == '.') process.nextTick(function(){
  new PortMapper({
    name:'test-portmapper',
    portMap:{
      forward:{
        9090:9090,
        9091:9091,
        9092:9092,
        9093:9093,
      },
      backward:{
        1234:1234,
      }
    }
  }).start()
})

////////////////////////////////////////////////////////////////////////////////

var Hook = require('hook.io').Hook
  , util = require('util')
  , execFile = require('child_process').execFile

var PortMapper = exports.PortMapper = function(config){
  Hook.call(this, config)
  var self = this
  if (!self.bin) self.bin = 'adb'
  if (!self.shouldLifeForever) self.on('connection::end', function(){self.kill()})
  if (!self.setupEventName) self.setupEventName = '*::adb::connected'
  if (!self.teardownEventName) self.teardownEventName = '*::adb::disconnected'
  
  if (!self.portMap) self.portMap = {}
  if (!self.portMap.forward) self.portMap.forward = {}
  if (!self.portMap.backward) self.portMap.backward = {}
  
  self.on('hook::ready', function(){
    Object_map(self.portMap.forward, self.forward, self)
    Object_map(self.portMap.backward, self.backward, self)
  })
}

util.inherits(PortMapper, Hook)

PortMapper.prototype._adb = function(args, callback){
  if (!Array.isArray(args)) args = [args]
  try {
    execFile(this.bin, args, callback)
  } catch(e){
    callback(e)
  }
}

PortMapper.prototype.forward = directionMethod('forward')
PortMapper.prototype.backward = directionMethod('backward')

function directionMethod(direction){
  return function(remote, local){
    var self = this
    if (+local) local = 'tcp:'+local
    if (+remote) remote = 'tcp:'+remote
    self.on(self.setupEventName, function(){
      self._adb([direction, local, remote], log)
    })
    self.on(self.teardownEventName, function(){
      self.emit('port::' + direction +'::'+ local + '::off', {port:local, connected:false})
    })
    function log(exitCode, out, err){
      if (exitCode) {
        self.emit('port::' + direction +'::'+ local + '::error', {port:local, connected:false, error:err || out})
        console.error('adb returned (%s): %s', exitCode, err || out)
        return
      }
      self.emit('port::' + direction +'::'+ local + '::on', {port:local, connected:true})
    }
  }
}

////////////////////////////////////////////////////////////////////////////////

function Object_map(object, fn, context){
  if (!context) context = null
  return Object.keys(object).map(function(key){
    return fn.call(context, object[key], key, object)
  })
}

function testLocalPort(port, callback){
  execFile('curl', ['--head', 'localhost:'+port], function(exitCode, out, err){
    if (exitCode !== 7 || String(out).indexOf("couldn't connect to host") === -1)
      return callback(null, port)
    return callback(Error(err || out), port)
  })
}
