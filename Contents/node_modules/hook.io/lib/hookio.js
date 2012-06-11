/*
 * hookio.js: Top-level include for the hookio module.
 *
 * (C) 2011 Nodejitsu Inc.
 * MIT LICENCE
 *
 */

var hookio = exports;

//
// Export the core `hookio` components.
//
hookio.cli  = require('./hookio/cli');
hookio.Hook = require('./hookio/hook').Hook;

hookio.createHook = function (options) {
  var hook = new hookio.Hook(options);
  return hook;
};

hookio.createWebServer = function (options) {
  var http = require('./hookio/http');

  return new http.Server(options);
}

hookio.createWebClient = function (options) {
  var http = require('./hookio/http');

  return new http.Client(options);
};
