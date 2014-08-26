/**
 * Created by kotarf on 8/25/14.
 */

require.config({
   baseUrl: "/js",
   paths: {
       sortapi: '../bookmarksorter',
       'QUnit': 'qunit-1.14.0'
   },
   shim: {
       'QUnit' : {
           exports: 'QUnit',
           init: function() {
               QUnit.config.autoload = false;
               QUnit.config.autostart = false;
               QUnit.config.reorder = false;
           }
       }
   }
});

require(['QUnit', 'tests'], function(QUnit, tests) {
   tests.call(this, chrome);
   QUnit.load();
   QUnit.start();
});
