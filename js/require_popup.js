requirejs.config({
    baseUrl: 'js',

    paths: {
        app: '../',

        lib: 'lib',

        sortapi: '../bookmarksorter'
    },

    shim: {
        'lib/jquery.total-storage' : ['jquery'],
        'lib/jquery.mjs.nestedSortable'  : ['jquery-ui'],
        'lib/jquery.browser' : ['jquery'],
        'lib/jquery.hotkeys' : ['jquery'],
        'lib/jquery.whenSync' : ['jquery'],
        'lib/Queue.src' : []
    }

});

require(['app/popup', 'jquery', 'domReady', ], function(SmartBookmarkSorter, $) {
        $(".spinner").hide();
        $("#tabs").show();
});