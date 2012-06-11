exports = module.exports = {
  "name":"android",
  "src":require.resolve("hook.io-herd"),
  "childHooks":[]
}

var adb = "adb"

exports.childHooks.push({
  "name": "android-isConnected",
  "src": require.resolve("../lib/hook.io-isconnected"),
  "bin": adb,
  "prefix": "adb::"
})

exports.childHooks.push({
  "name": "android-adb-portmap",
  "src": require.resolve("../lib/hook.io-portmap"),
  "bin": adb,

  "setupEventName": "*::adb::connected",
  "teardownEventName": "*::adb::disconnected",
  
  "portMap":{
    "forward":{
      "9222": "localabstract:chrome_devtools_remote"
    }
  }
})

/*
exports.childHooks.push({
  "src": require.resolve("../lib/hook.io-exec"),
  "name": "wake_lock",
  "bin": adb,
  "args": "shell svc power stayon",
  "allowedArgs": ["usb", "false", false]
})
*/

exports.childHooks.push({
  "src": require.resolve("../lib/hook.io-exec"),
  "name": "open-prefs",
  "bin": 'open',
  "args": [process.env.UserConfig],
})

/*
exports.childHooks.push({
  "src": require.resolve("../lib/hook.io-exec"),
  "name": "proc-cmdline",
  "bin": adb,
  "args": ["shell", 'cd /proc/; for pid in [0-9]*; do cmdline=`cat $pid/cmdline`; echo -e $pid\\\\t; done'],
  "allowedArgs": '',
  "events": {
    // "":
  }
})
*/
