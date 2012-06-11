var util = require('util'),
    Hook = require('./hook').Hook;
    mdns = null; // See require() at the end of file

var defaults = {
  'mdns-type': 'hookio',
  // If this value is set too low, the mDNS broadcast doesn't have time to fire.
  'mdns-listen-timeout': 1000
};

// Override of listen that accepts mdns parameters and
// advertises hook.io instance upon successful listening.
var listen = function(options, callback) {
  var listen = Hook.prototype.listen;
  var self = this;

  options = options || {};
  // Listen on all interfaces by default
  if(!options['hook-host']) {
    options['hook-host'] = '0.0.0.0';
  }

  Hook.prototype.listen.call(this, options, function(err) {

    if(err) {
      callback && callback(err);
      return;
    }

    options = options || {};

    var type = options['mdns-type'] || defaults['mdns-type'];
    var port = self['hook-port'];

    var _options = {};
    if(options['mdns-name']) _options['name'] = options['mdns-name'];
    if(options['mdns-domain']) _options['domain'] = options['mdns-domain'];
    if(options['mdns-host']) _options['host'] = options['mdns-host'];

    // Let everyone know AFTER successful advertisement
    var startedCb = function() {
      self.emit('hook::mdns::createAdvertisement', _options);
    };

    var ad = mdns.createAdvertisement(mdns.tcp(type), port, _options, startedCb);
    ad.start();

    if(callback) callback.apply(null, arguments);
  });

};

//
// Browses mDNS for hookio services with matching type and port
// and connects to it if found. Gives up after options
// 'mdns-listen-timeout' ms.
//
// TODO: instead of connecting to first found, make it possible to chose
//       from multiple ones through some sort of prioritization.
//
var connect = function(options, callback) {
  var self = this;

  var type = options['mdns-type'] || defaults['mdns-type'];
  var browser = mdns.createBrowser(mdns.tcp(type));
  var connect = Hook.prototype.connect;

  // Callbacks
  var _connect, serviceUp, serviceDown;
  // Timeout to be cancelled once connection is successful
  var timer;

  options = options || {};

  if(options['mdns-listen-timeout'] === undefined) {
    options['mdns-listen-timeout'] = defaults['mdns-listen-timeout'];
  }

  _connect = function(host, port) {
    browser.stop();
    clearTimeout(timer);

    options = options || {};
    options['hook-host'] = host;
    options['hook-port'] = port;

    connect.call(self, options, callback);
  };

  serviceUp = function(info, flags) {
    var host = info.addresses[0],
        port = info.port;

    self.emit('hook::mdns::serviceUp', info, flags);

    // FIXME: make this compare mdns-{name,domain,host} too
    if(options['hook-port']) {
      if(options['hook-port'] === port) {
        _connect(host, port);
      }
    } else {
      // If no port is not specified, connect to any hook found
      _connect(host, port);
    }
  };

  // TODO: use when implementing support for multiple services
  serviceDown = function(info, flags) {
    self.emit('hook::mdns::serviceDown', info, flags);
  };

  if(options['mdns-listen-timeout'] > 0) {
    timer = setTimeout(function() {
      // Stop listening for services, important for app
      // to not enter an infinite loop
      browser.stop();

      // Clear the callbacks, see remark about node_mdns below.
      serviceUp = serviceDown = null;

      if(callback) callback(new Error('Unable to connect'));
    }, options['mdns-listen-timeout']);
  }

  //
  // We have to relay the callbacks because node_mdns might
  // still call them even after we have called browser.stop()
  // which means we're no longer trying to connect.
  //
  browser.on('serviceUp', function() {
    if(serviceUp) serviceUp.apply(this, arguments);
  });
  browser.on('serviceDown', function() {
    if(serviceDown) serviceDown.apply(this, arguments);
  });

  browser.start();
};

//
// Overloaded start() tries
//
//  1. to... find a hook through mDNS for options['mdns-listen-timeout'] ms
//  2. or... gives up and tries to start listening
//  3. or... finally keeps listening forever
//
// (3. is there for the cast of two or more hooks simultaneously trying
//  to be the servers)
//
var start = function (options, callback) {
  var self = this;

  options = options || {};

  self.connect(options, function(err) {
    if(!err) {
      // Connect to existing
      if(callback) callback.apply(null, arguments);
    } else {
      // ... or start your own show
      self.listen.call(self, options, function(err) {
        if(err) {
          // ... but someone beat you to it.
          options['mdns-listen-timeout'] = 0;
          self.connect(options, callback);
        } else {
          if(callback) callback.apply(null, arguments);
        }
      });
    }
  });
};

exports.listen = listen;
exports.connect = connect;
exports.start = start;
exports.isAvailable = function() {
  return !!mdns;
};

//
// try/catch require the node-mdns library so we can fall back on the
// standard hook detection technique if not found.
//
try {
  mdns = require('mdns');
} catch(e) {
  // Replace methods to make sure they're not used if mdns is not found
  exports.listen = exports.connect = exports.start = function() {
    throw new Error('You need node-mdns to use this feature.');
  };
}


