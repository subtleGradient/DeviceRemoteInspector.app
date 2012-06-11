#! /usr/bin/env node
var hookio = require('../../lib/hookio'),
    path = require('path');

var public = path.resolve(__dirname, 'public');

var client = hookio.createWebClient({
  name: 'hook.io-webclient'
});

client.start('http://localhost:8080');

client.on('hook::ready', function() {

  setInterval(function ping() {
    client.emit('ping', function (err, place) {
      console.log('hello ' + place + '!');
    });
  }, 2000);

  client.on('*::pong', function (data, cb) {
    cb(null, 'I\'m '+client.name+' and you ponged me ?')
  })

});
