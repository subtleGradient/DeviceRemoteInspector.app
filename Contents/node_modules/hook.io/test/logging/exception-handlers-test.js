/*
 * exception-handlers-test.js: Exception handlers logging tests for the hook.io module
 *
 * MIT LICENCE
 *
 */
'use strict';

var vows, fs, assert, winston, Hook, hook, options;

fs      = require('fs');
vows    = require('vows');
assert  = require('assert');
winston = require('winston');
Hook    = require('../../lib/hookio').Hook;

options = {
  port    : 5002,
  logger  : {
    exceptionHandlers : {
      file : { filename : __dirname + "/err.log" }
    },

    handleExceptions  : true,
    exitOnError       : false
  }
};

vows.describe('hook.io/logging/exception-handlers').addBatch({
  "Given a hook with logging configuration" : {
    topic : function() {
      return new Hook(options);
    },

    "When a hook is ready" : {
      topic: function(hook) {
        var self;

        self  = this;

        hook.on('hook::ready', function() {
          self.callback(null, this._winston);
        });

        hook.start();
      },

      "It should convert the object into Winston exception handlers" : function(err, hookWinston) {
        var types, exceptionHandlers, name, capitalized;

        types             = options.logger.exceptionHandlers;
        exceptionHandlers = hookWinston.exceptionHandlers;

        for (name in types) {
          // capitalize the name
          capitalized = name.charAt(0).toUpperCase() + name.substr(1);

          assert.instanceOf(exceptionHandlers[name], winston.transports[capitalized]);
        }
      }
    },

    "When an uncaught exception is thrown" : {
      topic: function(hook) {
        var self = this;

        // can't really throw an error as vows will catch it,
        // so we simulate an uncaught exception
        hook._winston._uncaughtException(new Error('This error should be logged'));

        setTimeout(function() {
          // we first need to wait for the handler to timeout
          fs.readFile(hook.logger.exceptionHandlers.file.filename, 'utf-8', self.callback);
        }, 4000);
      },

      "It should write to the specified log file" : function(err, data) {
        assert.ifError(err);
        assert.ok(/This error should be logged/.test(data));

        fs.unlink(options.logger.exceptionHandlers.file.filename);
      }
    }
  }
}).export(module);
