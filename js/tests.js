define(["jquery", "underscore", "sortapi", "alchemy", "storage", "jqueryhelpers", "config", "chromeinterface", "sharedbrowser" ], function($, _, SmartBookmarkSorter, alchemy, storage, jhelpers, config, chromex, crossbrows) {

    return function(chrome) {

        QUnit.begin(function () {
            var items = $.totalStorage.getAll();

            for (var i = 0; i < items.length; ++i) {
                $.totalStorage.deleteItem(items[i].key);
            }

            storage.setApiKey("");
        });

        test("test", function () {
            ok(1 == "1", "Passed!");
        });

        QUnit.module("Alchemy requests");
        QUnit.asyncTest("Category request is successfully made", function () {

            var promise = alchemy.alchemyRequest(config.requestCategoryURL, "http://stackoverflow.com");

            promise.always(function(data) {
                equal(data.category, "recreation");
                start();
            });

        });

        QUnit.asyncTest("Title request is successfully made", function () {

            var promise = alchemy.alchemyRequest(config.requestTitleURL, "http://stackoverflow.com");

            promise.always(function(data) {
                equal(data.title, "Stack Overflow");
                start();
            });
        });

        // Can cache a category value and destroy it
        QUnit.test("Store category", function() {
            alchemy.cache("http://google.com", config.categoryProperty, "recreation");

            var cachedData = alchemy.cache("http://google.com");

            ok(cachedData);
        });

        QUnit.module("Categorization & Titles");

        // Category template object can be generated (singleton on module)
        test("Category object can be created", function() {
           var categoryObject = alchemy.alchemyCategoryObject();

            ok(categoryObject);

        });

        // Category promise is returned with valid data
        QUnit.test("Category promise, with valid URL that has a low score", function(assert) {
            assert.expect(3);

            var done1 = assert.async(),
                done2 = assert.async();

            var templateObject = alchemy.alchemyCategoryObject();

            var promise = templateObject.getData("http://www.ge.com/");

            ok(promise);

            promise.always(function(result) {
                strictEqual(result.data.status, config.okStatus, "Status must be OK");
                done1();
            });

            promise.fail(function() {
                ok(true);
                done2();
            });
        });

        // Category promise with a valid URL that has a low score
        /*
        asyncTest("Category promise, new, with a low score on a valid URL", function() {

        });
        */

        // Category promise with an invalid URL and no cache causes rejection
        QUnit.asyncTest("Category promise, with invalid URL", function() {
            var templateObject = alchemy.alchemyCategoryObject();

            var promise = templateObject.getData("www.thiswebsitedoesnotexist123123123.com");

            ok(promise);

            promise.fail(function(ret) {
                strictEqual(ret.data.status, config.errorStatus, "Status must be an error in this failed promise");
            });

            promise.done(function(data) {
                ok(false);
            });

            promise.always(function() {
                start();
            });
        });

        QUnit.module("Chrome API interface");

        // Create a bookmark (folder) via a promise
        QUnit.asyncTest("Chrome API - create a folder must return a promise", function() {
            var randomString = Math.floor(Math.random() * 100).toString();

            var bookmark = {
                title: randomString
            };

            var promise = chromex.createBookmark(bookmark);

            promise.done(function(result) {
                equal(result.title, randomString,"Chrome found the bookmark we created");
                chrome.bookmarks.search(randomString, function(results) {
                    ok(results.length);

                   // chrome.bookmarks.remove(results[0].id, $.noop());
                });
            });

            promise.always(function() {
                start();
            });
        });

        // Search bookmarks via a promise
        QUnit.asyncTest("Chrome API - search bookmarks (including folders) and return a promise", function() {
            var randomString = Math.floor(Math.random() * 100).toString();

            var bookmark = {
                title: randomString
            };

            chrome.bookmarks.create(bookmark, function(result) {
                start();

                var query = {
                    title: randomString
                };

                var promise = chromex.searchBookmarks(query)

                promise.always(function(results) {
                    equal(results[0].title, randomString, "We found the bookmark that we created via a promise.");
                    chrome.bookmarks.remove(results[0].id, $.noop());
                });
            });
        });

        QUnit.module("Cross browser helper functions");

        QUnit.test("Get a bookmarks subtree", function(assert) {
            var done1 = assert.async();

            var promise = crossbrows.bookmarksSubTree();

            promise.always(function(results) {
                console.log(results);
                ok(results);
                done1();
            });
        });

        QUnit.test("Convert a tree to divs", function(assert) {
            ok(0);

        });
        // Move a bookmark (folder) via a promise
        /*
        QUnit.test("Chrome API - move a folder and return a promise", function(assert){
            var done = assert.async();
            var randomStringParent = Math.floor(Math.random() * 100).toString();
            var randomStringChild = Math.floor(Math.random() * 100).toString();

            var bookmark = {
                title: randomString
            };

            chrome.bookmarks.create(bookmark, function(parent) {
                chrome.bookmarks.create(bookmark, function(child) {
                    var query = {
                        title: randomString
                    };

                    var promise = chromex.searchBookmarks(query)

                    promise.always(function(results) {
                        equal(results[0].title, randomString, "We found the bookmark that we created via a promise.");
                        chrome.bookmarks.remove(results[0].id, $.noop());
                    });
                });
            });
        });
        */

        // Category promise, old, with a valid URL that has a high score

        // Title promise is returned



        // URL with a poor score causes the promise to redo (category)

        // Sort one bookmark
        /*
        asyncTest("A single bookmark is sorted", function () {
            var callback = function () {

                chrome.bookmarks.search("Stack Overflow Test", function (results) {

                    _.each(results, function (element, index) {

                        var result = element,
                            parentId = result.parentId,
                            id = result.id;
                        chrome.bookmarks.remove(id, $.noop);
                        notEqual(parentId, 1, "parent is not other bookmarks");
                        ok(parentId, "parent exists");
                    }, results);

                    start();
                });
            };

            var bookmark = {
                title: "Stack Overflow Test",
                url: "http://stackoverflow.com"
            };
            var deferred = $.Deferred();

            chrome.bookmarks.create(bookmark, function (result) {

                SmartBookmarkSorter.sortBookmark(result, callback, deferred);
            });

        });
        */

    };
});
