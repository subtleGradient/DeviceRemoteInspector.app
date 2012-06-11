#!/usr/bin/env node
////////////////////////////////////////////////////////////////////////////////

if (module.id == '.') process.nextTick(function(){
  var myExecution = new Execution({
    name:'ls-slash',
    bin:'/bin/ls',
    args:['/']
  })
  myExecution.start()
  myExecution.on('hook::ready', function(){
    myExecution.emit('whatever::'+ myExecution.name, null, function(exitCode, out, err){
      console.log({ exitCode:exitCode, out:out, err:err })
    })
  })
})

////////////////////////////////////////////////////////////////////////////////

var Hook = require('hook.io').Hook
var util = require('util')
var execFile = require('child_process').execFile

var Execution = exports.Execution = function(config){
  Hook.call(this, config)
  var self = this
  if (typeof self.args == 'string') self.args = self.args.split(' ');
  if (!self.shouldLifeForever) self.on('connection::end', function(){self.kill()});
  self.on('*::execute::' + self.name, function(data, callback){
    self.execute(data, callback)
  })
}

util.inherits(Execution, Hook)

Execution.prototype.allowedArgs = ''

Execution.prototype.filterArg = function(arg){
  return this.allowedArgs.indexOf(arg) > -1
}

Execution.prototype.execute = function(userArgs, callback){
  if (userArgs == null) userArgs = []
  if (!Array.isArray(userArgs)) userArgs = [userArgs]
  var defaultArgs = this.args
  if (typeof this.args == 'function') defaultArgs = this.args.apply(this, userArgs)
  var args = defaultArgs.concat(userArgs.filter(this.filterArg, this))
  
  // this.emit('DEBUG::execute', [this.bin, args])
  execFile(this.bin, args, callback)
}
