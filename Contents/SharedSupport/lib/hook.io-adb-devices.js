#!/usr/bin/env node

////////////////////////////////////////////////////////////////////////////////

if (module.id == '.') process.nextTick(function(){
  new ADBDevices({name:'myADBDevices'}).start()
})

////////////////////////////////////////////////////////////////////////////////

var Hook = require('hook.io').Hook
  , util = require('util')
  , execFile = require('child_process').execFile

var observableObject = require('./observable-object')

var ADBDevices = exports.ADBDevices = function(config){
  Hook.call(this, config)
  var self = this
  if (!self.bin) self.bin = 'adb'
  self.args = ['devices']
  if (!self.timeout) self.timeout = 1000
  if (!self.shouldLifeForever) self.on('connection::end', function(){self.kill()})

  self.model = Object.create(observableObject, {
    emit:{writable:false, enumerable:false, configurable:false, value:self.emit.bind(self)}
  })

  self.updateStatus = self.updateStatus.bind(self)
  self.once('hook::ready', function(){
    self._interval = setInterval(self.updateStatus, self.timeout)
    self.updateStatus()
  })
  
  self.on('raw::changed', function(raw){
    var devices = {}, connections = [], disconnections = []
    
    ;(self.model.get('connections') || '').split(',').map(function(serial){devices[serial] = false})
    raw.replace(/^([\w-]+)(?=\tdevice)/gm, function(serial){devices[serial] = true})
    
    delete devices['']
    for (var serial in devices) {
      if (!self.model.isEqual(serial + '::connected', devices[serial]))
        self.emit((devices[serial] ? '' : 'dis') + 'connected', serial)
      
      self.model.set(serial + '::connected', devices[serial])
      
      if (devices[serial]) connections.push(serial)
      else disconnections.push(serial)
    }
    self.model.set('connections', connections.join(','))
    // self.model.set('disconnections', disconnections.join(','))
  })
}

util.inherits(ADBDevices, Hook)

ADBDevices.prototype.updateStatus = function(){
  var self = this
  execFile(self.bin, self.args, function(code, out, err){
    if (code) throw Error(err);
    self.model.set('raw', out)
  })
}
