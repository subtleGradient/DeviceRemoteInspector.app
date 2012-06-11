var hookio = require('./hook'),
    async  = require('async'),
    path   = require('path');

exports.spawn = function (hooks, callback) {
  var self = this,
      connections = 0,
      local,
      names;

  //
  // TODO: Finish "auto-install missing hooks" implementation
  //
  if (self.autoInstallMissingHooks) {
    self.once('spawn::error', function(spawnErr){
      if(spawnErr.code === "MISSING_MODULE") {
        self.emit('npm::link', spawnErr.hook.type, function(err){
          console.log('trying again!')
          self.spawn(spawnErr.hook);
        })
      }
    });
  }

  function onError (err) {

    //
    // Remark: Would it make sense to throw here?
    // We should have a better idea of the spawn error,
    // is it possible to get into a bad state if we have a failed spawn?
    //
    self.emit('spawn::error', { message: err.message });
    if (callback) {
      callback(err);
    }
  }
  
  if (!this.listening) {
    return onError(new Error('Cannot spawn child hooks without calling `.listen()`'));
  }  

  if (typeof hooks === "string") {
    hooks = new Array(hooks);
  }

  if (!(hooks instanceof Array) && typeof hooks === 'object'){
    hooks = new Array(hooks);
  }

  types = {};
  
  if (typeof hookio.forever === 'undefined') {
    //
    // Attempt to `require('forever')` and if it is available
    // then spawn all 
    //
    try {
      hookio.forever = require('forever');
    }
    catch (ex) {
      //
      // Remark: Should we be warning the user here?
      //
      hookio.forever = ex;
    }
  }
  
  //
  // Spawn in-process (i.e. locally) if `hookio.forever` has been set
  // purposefully to `false` or if it is an instance of an `Error` 
  // (i.e. it had previously failed to be required). 
  //
  local = self.local || !hookio.forever || hookio.forever instanceof Error;

  function spawnHook (hook, next) {
    var hookPath,
        hookBin,
        options,
        child,
        keys;

    if (typeof hook === 'string') {
      hook = {
        name: self.defaults.name,
        type: hook
      };
    }

    hook['host'] = hook['host'] || self['hook-host'];
    hook['port'] = hook['port'] || self['hook-port'];
    hook['name'] = hook['name'] || self.defaults.name;
    hook['configFilePath'] = hook['configFilePath'] || self['configFilePath'];

    //
    // Remark: hook.type is the type of hook, this will use NPM's
    // dependency tree to attempt the require lookup
    //
    if (hook.type) {
      hookPath = process.cwd() + '/node_modules/' + hook.type;
      hook.src = hookPath;
    }

    //
    // Remark: hook.src is a direct path to any hook
    //
    if (hook.src) {
      hookPath = hook.src;
    }

    try {
      require.resolve(hookPath);
    }
    catch (ex) {
      //
      // If for some reason, we can't find the hook,
      // return an error
      //
      self.emit('spawn::error', {
        message: ex.message,
        code: "MISSING_MODULE",
        hook: hook
      });
      return next(ex);
    }

    self.emit('hook::spawning', { name: hook.name, type: hook.type });

    if (local) {

      //
      // Create empty object in memory and dynamically require hook module from npm
      //
      self.children[hook.name] = {
        module: require(hookPath)
      };

      //
      // Here we assume that the `module.exports` of any given module
      // exports **no more than** one function. We assume it's a Hook constructor and instantiate it.
      //   
      keys = Object.keys(self.children[hook.name].module);
      keys = keys.filter(function(key){
        return typeof self.children[hook.name].module[key] == 'function';
      });
      keys.sort(); // Prioritize uppercased exports
      self.children[hook.name].Hook  = self.children[hook.name].module[keys[0]];
      self.children[hook.name]._hook = new (self.children[hook.name].Hook)(hook);

      //
      // When the hook has fired the `hook::ready` event then continue.
      //
      self.children[hook.name]._hook.once('hook::ready', next.bind(null, null));
      self.children[hook.name]._hook.connect(self);
    }
    else {

      //
      // TODO: Make `max` and `silent` configurable through the `hook.config`
      // or another global config.
      //
      options = {
        max: 10,
        silent: false,
        logFile: path.join('./forever-' + hook.type + '-' + hook.name)
      };

      //
      // If the first argument to `forever.Monitor` is an Array, it treats the
      // first element as the command to run and the rest of the array as
      // arguments. Otherwise, it treats the script as an argument to `node`,
      // with the rest of the arguments take from `options.options`. This
      // supports both.
      //
      if (Array.isArray(self.hookBin)) {
        hookBin = self.hookBin.concat(self._cliOptions(hook));
      }
      else {
        hookBin = self.hookBin;
        options.options = self._cliOptions(hook);
      }
      console.log(options)
      child = new (hookio.forever.Monitor)(hookBin, options);
      child.on('start', function onStart (_, data) {
        //
        // Bind the child into the children and move on to the next hook
        //
        self.children[hook.name] = {
          bin: hookBin,
          monitor: child
        };
        
        self.emit('child::start', hook.name, self.children[hook.name]);
        next();
      });
      
      child.on('restart', function () {
        self.emit('child::restart', hook.name, self.children[hook.name]);
      });
      
      child.on('exit', function (err) {
        //
        // Remark: This is not necessarily a bad thing. Hooks are not by definition
        // long lived processes (i.e. worker-hooks, tbd).
        //
        self.emit('child::exit', hook.name, self.children[hook.name]);
      });

      child.start(); 
    }
  }
  
  var _hooks = [];
  self.many('*::hook::ready', hooks.length,  function (_hook) {
    connections++;
    _hooks.push(_hook);
    //
    // If we have spawned the correct amount of hooks,
    // then we will emit `children::ready`
    //
    if (connections === hooks.length) {
      self.emit('children::ready', hooks);
      if (callback) {
        callback(null, _hooks);
      }
      //self.off('client::connected', onConnect);
    }
  });

  async.forEach(hooks, spawnHook, function (err) {
    if (err) {
      return onError(err);
    }

    self.emit('children::spawned', hooks);
  });
  
  return this;
};
