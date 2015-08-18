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
        'lib/jquery.whensync' : ['jquery'],
        'lib/underscore.string' : ['underscore'],
        'lib/Queue.src' : [],
        'autosort' : {
            exports: 'AutoSort'
        }
    }
});

(function(window) {
    // Initialize background service
    window.require(['autosort', 'storage'], function(autosort, storage) {
        if(_.isUndefined(window.AutoSort)) {
            window.AutoSort = autosort;
        }

        var isOnInterval = storage.getAutoInterval(),
            isPrioritize = storage.getAutoPrioritize(),
            isAutoSort = storage.getAutoOn();

        if(isAutoSort) {
            autosort.enableAutomaticSort(isOnInterval, isPrioritize);
        }
    });
})(this);