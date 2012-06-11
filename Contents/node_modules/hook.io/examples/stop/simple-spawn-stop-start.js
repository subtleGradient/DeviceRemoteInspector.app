/*
 * Creates a server hook, spawn a client hook, kill the spawned client
 */

//
// WARN: Currently experiencing a race condition when using this example, 
// this means that there is a flaw somewhere in the start / stop / kill logic
//

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
        setTimeout(function(){
          hook1.start();
        }, 5000);
      });
    }
  });
  
});

hook1.start();

