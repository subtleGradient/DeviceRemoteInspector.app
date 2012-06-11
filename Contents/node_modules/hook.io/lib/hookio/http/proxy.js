/**
 * The webserver listen on browser-client connection thru dnode (over socket.io).
 *
 * When a client gets connected, a dnode (over raw tcp or http) connection
 * is established with the main hook (could be the webserver or an other one)
 * communcation is proxied between the 2 dnode connections.
 *
 * WARN : for each new browser-cleint connection a new dnode connection with the hook
 * is established..
 * TODO : multiplexing these connection in a single one to spare tcp connections.
 */

module.exports = function () {
  var dnode = require('../../../vendor/dnode');

  //get hook to connect
  var remoteOptions = {
    host: this['hook-host'],
    port: this['hook-port']
  };

  dnode(function(client, client_conn) {
    var hook_wrapper = this;
    var remote_hook;
    var client_name;

    client_conn.on('ready', function () {
      dnode(function(hook, hook_conn) {
        var client_wrapper = this;
        remote_hook = hook;

        //from hook to browser client
        client_wrapper.message = function(event, data, callback, sender) {
          client.message(event, data, callback, sender);
        };

        client_wrapper.hasEvent = function(event, callback) {
          client.hasEvent(event, callback);
        };

        hook_conn.on('ready', function() {
          client.message('proxy::ready');
        });

        client_conn.on('end', function () {
          hook_conn.end();
        });
      }).connect(remoteOptions);
    });
  

    //from client to hook
    this.message = function(event, data, callback, sender) {
      remote_hook.message(event, data, callback, sender);
    };

    this.hasEvent = function(event, callback) {
      remote_hook.hasEvent(event, callback);
    };

    this.report = function(_hook, cb) {
      remote_hook.report(_hook, cb);
    };

  }).listen(this.webserver);
};
