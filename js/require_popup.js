requirejs.config({
    baseUrl: 'js',

    paths: {
        app: '../app',

        jquery: [
            'jquery' //local
        ]
    },

    shim: {
        'jquery.total-storage' : ['jquery']

    }

});

requirejs(['../popup', 'jquery', 'domReady'], function(SmartBookmarkSorter, $) {});
