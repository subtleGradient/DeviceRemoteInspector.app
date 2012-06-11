//
// Automagically constructs a new Hook for the browser
//

//
// Remark: More advanced users might want to comment this file out and manually create Hooks
//
var Hook = require('/hook.js').Hook;
var hook = new Hook({
  name : 'browser-hook'
});
hook.connect();