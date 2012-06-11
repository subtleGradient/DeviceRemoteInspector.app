var hookio = require('../../lib/hookio');

//
// Create server hook
//
hookio.createHook({
  authorize: customAuth
}).listen();

//
// Create client hook
//
hookio.createHook({
  user     : "marak",
  password : "test123"
}).connect();


function customAuth(user, password, cb) {
  if (user == 'marak' && password == 'test123') {
    //
    // true indicates that login worked
    //
    cb(null, true);
  }
  else {
    //
    // false indicates that login failed
    //
    cb(null, false);
  }
}