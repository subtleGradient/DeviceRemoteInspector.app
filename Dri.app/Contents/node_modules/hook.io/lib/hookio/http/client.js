var Hook          = require('../hook').Hook,
    util          = require('util'),
    createSocket  = require('./client-stream');

var Client = exports.Client = function (options) {
  options = options || {};
  Hook.call(this, options);
};

util.inherits(Client, Hook);

Client.prototype.start = Client.prototype.connect = function () {
  var argv = [].slice.call(arguments),
      host = argv.shift(),
      stream = createSocket(host);

  this.stream = stream;
  Hook.prototype.connect.apply(this, argv);
}
