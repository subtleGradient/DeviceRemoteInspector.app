var assert = require('assert'),
    vows = require('vows'),
    Hook = require('../../lib/hookio').Hook;

var testData = require('../helpers/macros').testData;

vows.describe('hook.io/mdns/start')
.addBatch({
  'A *first hook* is started on a *random port*': {
    topic: function () {
      var hook = new Hook({ name: 'hook', debug: true, m: true });

      var cb = this.callback.bind(hook, null, hook);
      hook.on('hook::mdns::createAdvertisement', cb);

      var port = 5000 + Math.floor(Math.random() * 2000);
      hook.listen({ 'hook-port': port });
    },
    'and is *advertised* through mDNS': {
      'so that a *second hook*': {
        topic: function (hook) {
          var hook2 = new Hook({ name: 'hook2', debug: true, m: true });
          var cb = this.callback.bind(this, hook, hook2);
          hook2.on('hook::connected', cb);

          hook2.connect({ 'mdns-listen-timeout': 0 });
        },
        'will discover it automatically, *without knowing* its port.*': function (hook1, hook2) {
          assert.equal(hook1['hook-port'], hook2['hook-port']);
        }
      },
    }
  }
})
.addBatch ({
  'Three hooks are started': {
    topic: function() {
      var hook1 = new Hook({ name: 'hook1', debug: true, m:true });
      var hook2 = new Hook({ name: 'hook2', debug: true, m:true });
      var hook3 = new Hook({ name: 'hook3', debug: true, m:true });

      var listener, conn1, conn2;

      var listenerCb = function() {
        if(!listener) {
          listener = this;
        }
      };

      hook1.on('hook::listening', listenerCb);
      hook2.on('hook::listening', listenerCb);
      hook3.on('hook::listening', listenerCb);

      var cb = this.callback.bind(this, [ hook1, hook2, hook3 ])

      var nReady = 0;
      var readyCb = function() {
        nReady++;
        // Run tests once all hooks are ready
        if(nReady >= 3) cb(listener);
      };

      hook1.on('hook::ready', readyCb);
      hook2.on('hook::ready', readyCb);
      hook3.on('hook::ready', readyCb);

      var opts = {
        'hook-port': 5001,
        // FIXME: see how low this value can be without mDNS serviceUp
        //        fails to trigger in time. Want to keep it low to speed
        //        up the tests.
        'mdns-listen-timeout': 100
      };
      // They're all started at the same time, so we can't be sure who will be the
      // listener. Hence the somewhat involed logic with readyCb and listenerCb.
      hook1.start(opts); hook2.start(opts); hook3.start(opts);
    },
    'one starts listening and the two others connect': function(hooks, listener) {
      // Make sure one hook was registered as listener at all
      assert.ok(listener);
      assert.ok(hooks);

      for(i in hooks) {
        var hook = hooks[i];
        if(hook !== listener) {
          assert.isTrue(hook.connected);
        } else {
          assert.isFalse(hook.connected);
        }
      }
    }
  }
})

.addBatch({
  'One hook listens on port 5003': {
    topic: function() {
      var hook = new Hook({ name: 'hook', debug: true, m: true });
      hook.listen({ 'hook-port': 5003 });

      var cb = this.callback.bind(this, null, hook);
      hook.on('hook::mdns::createAdvertisement', cb);
    },
    ' and another looks for hooks on port 5004': {
      topic: function() {
        var hook = new Hook({ name: 'hook2', debug: true, m: true });
        hook.start({
          'hook-port': 5004,
          'mdns-listen-timeout': 500
        });
        var cb = this.callback.bind(this, null, hook);

        hook.once('hook::mdns::serviceUp', cb);
      },
      ' but ignores the hook on port 5003': function(hook) {
        assert.isFalse(hook.connected);
      }
    }
  }
})

.export(module);
