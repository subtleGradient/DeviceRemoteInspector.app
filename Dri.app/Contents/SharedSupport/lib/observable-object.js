Object.defineProperties(exports, {
  
  emit:{writable:true, configurable:false, value:function(){}},
  
  isEqual:{writable:false, enumerable:false, configurable:false, value:function(key, value){
    if (this[key] === value) return true
    if (typeof value == 'object') {
      return JSON.stringify(this[key]) == JSON.stringify(value)
    }
    return this[key] == value
  }},
  
  set:{writable:false, configurable:false, value:function(key, value){
    if (this.isEqual(key, value)) return
    this[key] = value
    this.emit(key + '::changed', value)
    if (value == null) this.emit(key + '::deleted')
    if (typeof value == 'boolean' || typeof value == 'number') this.emit(key + '=' + value)
  }},
  
  get:{writable:false, configurable:false, value:function(key, defaultValue){
    if (this.isEqual(key, undefined)) {
      this.set(key, defaultValue)
      return defaultValue
    }
    return this[key]
  }}
  
})
