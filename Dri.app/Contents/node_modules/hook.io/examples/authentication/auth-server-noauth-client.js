var hookio = require('../../lib/hookio');

hookio.createHook({
  authorize: customAuth
}).listen();


hookio.createHook().connect();


function customAuth(user, password, cb) {
  console.log('running custom auth')
  if (user == 'marak' && pass == 'test') {
    console.log(user, ' succeeded!');
  }
  else {
    console.log(user, ' failed!');
    cb(null);
  }
}