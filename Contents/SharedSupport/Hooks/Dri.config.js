module.exports=
{
  "type":"herd",
  "name":"Dri.app",
  "autoheal":false,
  "childHooks":[

    { "configFilePath":"./Android.config.js" }
    // ,
    // { "name":"frontend-server", "type":"webserver", "port":8182, "webroot":require('path').resolve('../Frontend') }
    // ,
    // { "name":"frontend-client", "src":"../lib/hook.io-webview/lib/webview", "url":"http://localhost:8182/" }

  ]
}
