requirejs.config({
    baseUrl: 'js',

    paths: {
        app: '../',
        lib: 'lib',
        sortapi: '../bookmarksorter'
    },
});
require(['domReady!'], function() {
    require(['jquery', 'app/popup'], function($) {
        $(".spinner").hide();
        $("#tabs").show();
    });
});