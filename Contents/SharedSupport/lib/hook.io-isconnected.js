#!/usr/bin/env node

////////////////////////////////////////////////////////////////////////////////

if (module.id == '.') process.nextTick(function(){
  new IsConnected({name:'isConnected'}).start()
})

////////////////////////////////////////////////////////////////////////////////

var Hook = require('hook.io').Hook
  , util = require('util')
  , spawn = require('child_process').spawn

var IsConnected = exports.IsConnected = function(config){
  Hook.call(this, config)
  var self = this
  if (!this.bin) this.bin = 'adb'
  if (!this.args) this.args = ['status-window']
  if (!this.values) this.values = {unknown:'disconnected', device:'connected'}
  if (!this.prefix) this.prefix = 'adb::'
  if (!this.shouldLifeForever) this.on('connection::end', function(){self.kill()})
  
  self.ready = false
  self.on('hook::ready', function(){
    if (self.ready) throw Error('Why would this happen again?!')
    
    self.ready = true
    
    var statusWindow = spawn(this.bin, this.args)
    self.on('hook::stop', function(){
      statusWindow.kill()
    })
    process.on('uncaughtException', function(error){
      statusWindow.kill()
    })
    
    var lastData
    statusWindow.stdout.on('data', function(data){
      lastData = String(data)
      var newState = lastData.match(/State: (\w+)/)
      if (!newState) return
      newState = newState[1]
      self._setState(self.values[newState] || newState)
    })
    
    statusWindow.stderr.on('data', function(data){
      lastData = String(data)
    })
    
    statusWindow.on('exit', function(exitCode){
      if (exitCode) {
        self.emit('warning', {path:self.bin, exitCode:exitCode, output:lastData})
        console.warn(lastData)
      }
      self.stop()
    })
    
  })
}

util.inherits(IsConnected, Hook)

IsConnected.prototype._setState = function(newValue){
  var oldValue = this.currentValue
  if (oldValue == newValue) return
  this.currentValue = newValue
  this.emit(this.prefix + String(newValue))
}
