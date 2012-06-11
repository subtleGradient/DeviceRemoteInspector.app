var hookio  = require('./hook'),
    async   = require('async'),
    path    = require('path'),
    winston = require('winston');

Error.prototype.toJSON = function(){
  return {
    message: this.message
  };
};

exports.log = function() {
  // setup winston
  setupWinston.call(this);

  // return the actual loggin method
  return function log(hook, event, data, sender) {
    if (!this.silent) {
      sender    = sender || {};

      var name  = sender.name  || 'no name specified',
          type  = sender.type  || 'no type specified',
          // Determine whether this is the log of a locally or remotely generated event
          local = hook.name ? hook.name === sender.name : false;

      data  = data  || 'null';
      event = event || 'no event specified';

      //
      // TODO: Add the ability to filter what gets logged,
      //       based on the event namepace
      //

      if (typeof data === 'object') {
        if (data instanceof Error) {
          data = data.toJSON(data);
        }
        data = JSON.stringify(data);
      }

      data = data.toString();

      //
      // Remark: The current approach to rendering to the console will break on really,
      // long event names or hook names or hook types. I will take a patch to make the,
      // the CLI reporter better.
      //
      //
      //       hook.emit('super::really::long::event::long::long:on:asdasdasdasdasdasdasd');
      //       ^^ will break console table formatting
      //
      //
      var truncatedData = data,
          maxChars      = 50;

      if (!this.verbose) {
        if(truncatedData.length >= maxChars) {
          truncatedData = truncatedData.substr(0, maxChars) + ' ... ';
        }
      }

      var color = local ? 'green' : 'magenta';

      this._winston.info(
        ' Name: '[color].bold + pad(name, 20)[color] + ' ' + pad(event, 40).yellow +
        ' Type: '.cyan.bold + pad(type, 15).cyan +
        ' Data: '.grey.bold + truncatedData.grey
      );
    }
  };
};

function pad(str, len, chr) {
  var s;

  if (!chr) {
    chr = ' ';
  }

  s = str;

  if (str.length < len) {
    for (var i = 0; i < (len - str.length); i++) {
      s += chr;
    }
  }

  return s;
}

//
// configure winston for hook.io
//
function setupWinston() {
  this._winston = winston;

  //
  // we have custom options, handle them
  //
  if (typeof this.logger === 'object') {
    var options, transports, exceptionHandlers;

    options = this.logger;

    // prepare transports
    transports = prepareTransport(options.transports);
    
    // prepare exception handlers
    exceptionHandlers = prepareTransport(options.exceptionHandlers);

    // clone the configuration, we want to keep the original args intact
    options = JSON.parse(JSON.stringify(options));

    if (transports) options.transports = transports;
    if (exceptionHandlers) options.exceptionHandlers = exceptionHandlers;

    this._winston = new (winston.Logger)(options);
  }
}

//
// converts an object into an array of winston tranports
//
// { console : {} } -> [ new (winston.transports.Console)() ]
//
function prepareTransport(collection) {
  if (!collection || collection instanceof Array) {
    return collection;
  }

  var name, config, arr = [];

  for (name in collection) {
    config = collection[name];

    // capitalize transport name
    name = name.charAt(0).toUpperCase() + name.substr(1);

    arr.push(new winston.transports[name](config));
  }

  return arr;
}
