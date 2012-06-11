#!/usr/bin/env node
////////////////////////////////////////////////////////////////////////////////

if (module.id == '.') process.nextTick(function(){
  var myAutoRequestMapper = new AutoRequestMapper({
    name:'test-fireflycontrolmapper',
    mappings:[
      { on:'test', url:'http://localhost/', emitName:'localhost' },
      { on:'test', url:'http://localhost/this-should-not-exist', emitName:'this-should-not-exist' },
      { on:'*::port::forward::9090::on', url:'http://localhost:9090/wake_lock_on', emitName:'wake_lock_on'},
      { on:'*::port::forward::9091::on', url:'http://localhost:9090/start_remote_web_inspector?port=9091&tikbew=0', emitName:'web-inspector::ready::0', emitData:'http://localhost:9091'},
      { on:'*::port::forward::9092::on', url:'http://localhost:9090/start_remote_web_inspector?port=9092&tikbew=1', emitName:'web-inspector::ready::1', emitData:'http://localhost:9092'},
      { on:'*::port::forward::9093::on', url:'http://localhost:9090/start_remote_web_inspector?port=9093&tikbew=2', emitName:'web-inspector::ready::2', emitData:'http://localhost:9093'},
    ]
    
  })
  myAutoRequestMapper.start()
  myAutoRequestMapper.on('hook::ready', function(){
    myAutoRequestMapper.emit('test')
  })
})

////////////////////////////////////////////////////////////////////////////////

var Hook = require('hook.io').Hook
  , util = require('util')
  , request = require('request')
  , STATUS_CODES = require('http').STATUS_CODES

var AutoRequestMapper = exports.AutoRequestMapper = function(config){
  Hook.call(this, config)
  var self = this
  if (!self.shouldLifeForever) self.on('connection::end', function(){self.kill()})
  if (!self.mappings) self.mappings = {}
  
  self.mappings.map(function(mapping){
    self.on(mapping.on, function(){

      request(mapping.url, function(error, response, body){
        if (!response) response = {}
        var statusText = STATUS_CODES[response.statusCode]
          
        if (response.statusCode < 200 || response.statusCode > 299)
          error = Error(statusText)
          
        if (error) return self.emit(mapping.emitName + '::error', mapping.emitData || error)
          
        self.emit(mapping.emitName, mapping.emitData || true)
      })

    })
  }, self)
}

util.inherits(AutoRequestMapper, Hook)
