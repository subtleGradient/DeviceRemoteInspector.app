var hookio = require('../../lib/hookio');

var master = hookio.createHook({ 
  "name": "master-hook", 
  "hooks": [
   { "type" : "request" },
   { "type" : "none-exist" },

  ]
});

master.on('spawn::error', function(err){
  console.log(err)
});

master.listen();
