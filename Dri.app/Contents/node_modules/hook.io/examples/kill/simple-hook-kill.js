/*
 * Creates a server hook, a client hook, kills the client hook
 */

var Hook = require('../../lib/hookio').Hook;

var hook1 = new Hook({
  name: "server-hook",
  debug: "true"
});

hook1.on('hook::ready', function() {
  setInterval(function() {
    hook1.emit('hello', hook1.name);
  }, 1000);
});

hook1.start();

var hook2 = new Hook({
  name: "client-hook",
  debug: "true"
});

hook2.on('hook::ready', function() {
  var counter = 0;
  hook2.on('*::hello', function(){
    console.log('got hello');
    counter++;
    if (counter >= 3) {
      hook2.kill();
    }
  });
});

hook2.start();
