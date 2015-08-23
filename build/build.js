/**
 * Created by kotarf on 8/22/2015.
 */
({
    appDir: "../",
    baseUrl: "js",
    dir: "dist",
    paths: {
        app: '../',
        lib: 'lib',
        sortapi: '../bookmarksorter',
    },
    modules: [
        {
            name: "require_popup"
        },
        {
            name: "require_background",
            excludeShallow: [
                "lib/jquery.mjs.nestedSortable"
            ]
        }
    ],
    fileExclusionRegExp: /docs|build|.idea|.git|.gitignore|Chrome_Export_Bookmarks.png|tests.js|require_tests.js|qunit/
})