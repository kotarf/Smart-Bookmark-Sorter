requirejs.config({
    baseUrl: 'js',

    paths: {
        app: '..',
        lib: 'lib',
        sortapi: '../bookmarksorter'
    },

    shim: {
        'lib/jquery.total-storage' : ['jquery'],
        'lib/jquery.whensync' : ['jquery'],
        'autosort' : {
            exports: 'AutoSort'
        }
    }
});

// Initialize background service
require(['autosort', 'storage'], function(autosort, storage) {
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

// On installed or update, set the background page's AutoSort module as a global on the window
chrome.runtime.onInstalled.addListener(function() {
        require(['autosort'], function(autosort) {
            if(_.isUndefined(window.AutoSort)) {
                window.AutoSort = autosort;
            }
        });
});