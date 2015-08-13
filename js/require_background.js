requirejs.config({
    baseUrl: 'js',

    paths: {
        app: '..',

        lib: 'lib',

        sortapi: '../bookmarksorter'
    },

    shim: {
        'lib/jquery.total-storage' : ['jquery'],
        'lib/jquery.mjs.nestedSortable'  : ['jquery-ui'],
        'lib/underscore.string' : ['underscore'],
        'autosort' : {
            exports: 'AutoSort'
        }
    }
});

require(['autosort', 'jquery'], function(autosort) {
    this.AutoSort = autosort;
});