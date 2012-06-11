// socket.io-client-stream.js
// Use this to talk dnode over socket.io as a client, in node.
// A SubStack one-off, riffed on by Joshua Holbrook.
//
// Usage:
/*
      var stream = require('./client-stream')('http://localhost:8080');
      dnode.connect(stream, function (remote) {
          remote.cat(function (says) {
              console.log('the cat says: ' + says);
          });
      });
*/
//

var io = require('socket.io-client'),
    Stream = require('stream');

module.exports = function (host) {
  var sock = io.connect(host),
      stream = new Stream();

  stream.writable = true;
  stream.readable = true;

  stream.write = function (buffer) {
    sock.emit('message', String(buffer));
  };

  stream.destroy = stream.end = function () {
    sock.disconnect();
    stream.emit('end');
  };

  sock.on('message', function (message) {
    stream.emit('data', message);
  });

  sock.on('connect', function () {
    stream.emit('connect');
  });

  return stream;
};


