requirejs.config({
    baseUrl: 'js',

    paths: {
        app: '../app',

        jquery: [
            'jquery' //local
        ],

        sortapi: '../bookmarksorter'
    },

    shim: {
        'underscore': {
            exports: ['_']
        },

        'jquery.total-storage' : ['jquery'],

        'jquery.whensync' : ['jquery'],

        'purl' : ['jquery']

    }

});

require(['sortapi', 'jquery', 'domReady'], function(SmartBookmarkSorter, $) {});