var Hook   = require('../hook').Hook,
    util   = require('util'),
    path   = require('path'),
    proxy  = require('./proxy');

var Server = exports.Server = function (options) {
  options = options || {};

  this.browserClients = {};
  var self = this;

  if(typeof options.webserver == 'function') {
    // We can wrap an existing http server.
    this.webserver = options.webserver;
    /*
    this.once('hook::ready', function()  {
      self.startHookProxy();
    });
    */

  } else {
    // if no options create a server that listens on port 8080
    var port = ('number' == typeof options.webserver) ? options.webserver : 8080;

    var union = require('union'),
        ecstatic = require('ecstatic'),
        basicAuth = require('./middleware/basic-auth'),
        middlewares = [];

    if(typeof options.basicAuth == 'object') {
      middlewares.push(basicAuth(
        options.basicAuth.username || 'admin',
        options.basicAuth.password || 'admin'
      ));
    }

    middlewares.push(ecstatic(
      path.join(__dirname, '..', 'browser', 'build'), {
      autoIndex: false,
      handleErrors: false
    }));

    if(typeof options.webroot == 'string') {
      middlewares.push(ecstatic(options.webroot));
    }

    this.webserver = union.createServer({
      before: middlewares
    });

    /*
    this.webserver.listen(port, function(err, result) {
      if (err) {
        self.emit('webserver::error', error);
        return;
      }
      self.emit('webserver::started', port);
      self.once('hook::ready', function()  {
        self.startHookProxy();
      });
    });
    */
  }
  //options.server = this.webserver.server ? this.webserver.server : this.webserver;

  Hook.call(this, options);
  
  return this;
};

util.inherits(Server, Hook);

Server.prototype.listen = function () {
  var self = this;
  this.webserver.listen(8080, function (err) {
    if (err) {
      throw err;
    }
    Hook.prototype.listen.apply(self, arguments);
  });
}

/*
Server.prototype.startHookProxy = function () {
  return proxy.call(this);
};
*/
