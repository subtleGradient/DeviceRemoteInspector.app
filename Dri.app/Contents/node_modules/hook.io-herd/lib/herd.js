#!/usr/bin/env node
/*jshint asi:true*/

if (module.id == '.') process.nextTick(function(){
  
  new Herd({ configFilePath:require.resolve('../example/simpsons.config.json') }).start()
  
})

var Hook = require('hook.io').Hook
var util = require('util')

exports.Herd = Herd
function Herd(config){
  var herd = this
  Hook.call(herd, herd.configFrom(config))
  
  if (!(herd.childHooks && Array.isArray(herd.childHooks))) herd.childHooks = []
  herd.childHooks = herd.childHooks.map(herd.childConfigFrom, herd)
  
  herd.on('hook::ready', function(){
    herd.listening = true // workaround hook.io bug
    if (herd.childHooks && herd.childHooks.length) {
      herd.spawn(herd.childHooks)
    }
  })
}

util.inherits(Herd, Hook)

Herd.prototype.configFilePath = null
  
Herd.prototype.src = null
  
Herd.prototype.type = null
  
// don't create blank config.json files all over the place
Herd.prototype.noConfig = true
  
// stay alive unless explicitly killed
Herd.prototype.autoheal = true
  
Herd.prototype.ignoreSTDIN = true
  
// array of child hook configs
Herd.prototype.childHooks = null

Herd.prototype.childConfigDefaults = {
  events:{},
  autoheal:false
}

Herd.prototype.normalizeConfigSrc = function(config, module){
  if (config.type) {
    config.src = 'hook.io-' + config.type
    delete config.type
  }
  if (config.src) {
    config.src = Module_resolveFilename(config.src, module)
  }
  return config
}

Herd.prototype.childConfigFrom = function(childConfig){
  childConfig = this.configFrom(childConfig)
  
  for (var key in this.childConfigDefaults) {
    if (childConfig.hasOwnProperty(key)) continue
    childConfig[key] = this.childConfigDefaults[key]
  }
  
  childConfig.events['*::die'] = function(){
    this.stop()
  }
  
  var parentModule = this.configFilePath ? requireModule(this.configFilePath) : childConfig.parentModule
  this.normalizeConfigSrc(childConfig, parentModule)
  
  return childConfig
}
  
Herd.prototype.configFrom = function(config){
  if (!config.configFilePath) return config
  
  // All this magical nonsense is necessary to allow type, src and configFilePath properties to be relative to their parent config
  
  var parentModule = this.configFilePath ? requireModule(this.configFilePath) : config.parentModule
  var mod = requireModule(config.configFilePath, parentModule)
  mod.exports.configFilePath = mod.filename
  
  // Starting from the config module, resolve the src or type
  
  this.normalizeConfigSrc(mod.exports, mod)
  
  return mod.exports
}

////////////////////////////////////////////////////////////////////////////////

var Module = require('module')

requireModule._cache = {}
function requireModule(filename, parent){
  filename = filename.replace(/^~/, process.env.HOME)
  if (requireModule._cache[filename]) return requireModule._cache[filename]
  var module = new Module(filename)
  requireModule._cache[filename] = module
  if (!module.loaded) module.load(Module_resolveFilename(filename, parent))
  return module
}

function Module_resolveFilename(filename, module){
  var resolvedFilename = Module._resolveFilename(filename, module)
  if (Array.isArray(resolvedFilename)) resolvedFilename = resolvedFilename[0]
  return resolvedFilename
}

