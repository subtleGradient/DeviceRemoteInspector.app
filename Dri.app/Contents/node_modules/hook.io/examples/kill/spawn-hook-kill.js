/*
 * Creates a server hook, spawn a client hook, kill the spawned client
 */

var Hook = require('../../lib/hookio').Hook;

var hook1 = new Hook({
 name: "server-hook",
 debug: "true",
 hooks: [
   {
     name: "client-hook",
     type: "helloworld",
     debug: "true"
   }
 ]
});

hook1.on('hook::ready', function() {

  var counter = 0;
  hook1.on('*::hello', function(){
    console.log('got hello');
    counter++;
    if (counter >= 3) {
      hook1.kill('client-hook', function(err){
        if (err) {
          console.log(err);
        }
      });
    }
  });
  
  
  
});

hook1.start();

