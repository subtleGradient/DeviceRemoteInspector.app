/*
 * transports-test.js: Transport logging tests for the hook.io module
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
    transports  : {
      file : { filename : __dirname + "/file.log" }
    }
  }
};

vows.describe('hook.io/logging/transports').addBatch({
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

      "It should convert the object into Winston transports" : function(err, hookWinston) {
        var types, transports, name, capitalized;

        types       = options.logger.transports;
        transports  = hookWinston.transports;

        for (name in types) {
          // capitalize the name
          capitalized = name.charAt(0).toUpperCase() + name.substr(1);

          assert.instanceOf(transports[name], winston.transports[capitalized]);
        }
      }
    },

    "When the log() method is called" : {
      topic: function(hook) {
        var self = this;

        hook.log(hook, 'Some event', 'This should be logged');

        setTimeout(function() {
          // wait awhile as the file is written to
          fs.readFile(hook.logger.transports.file.filename, 'utf-8', self.callback);
        }, 1000);
      },

      "It should write to the specified log file" : function(err, data) {
        assert.ifError(err);
        assert.ok(/This should be logged/.test(data));

        fs.unlink(options.logger.transports.file.filename);
      }
    }
  }
}).export(module);
