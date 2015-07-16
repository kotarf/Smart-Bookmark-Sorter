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

            var promise = alchemy.AlchemyObject.alchemyRequest(config.requestCategoryURL, "http://stackoverflow.com");

            promise.always(function(data) {
                equal(data.category, "recreation");
                start();
            });

        });

        QUnit.asyncTest("Title request is successfully made", function () {

            var promise = alchemy.AlchemyObject.alchemyRequest(config.requestTitleURL, "http://stackoverflow.com");

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
        QUnit.test("Category promise, with valid URL that has a good result", function(assert) {

            var done1 = assert.async(),
                done2 = assert.async();

            var templateObject = alchemy.alchemyCategoryObject(),
                promise = templateObject.getData("http://www.cnn.com/");

            ok(promise);

            promise.always(function(result, data) {
                strictEqual(data.status, config.okStatus, "Status must be OK");
                done1();
            });

            promise.done(function(result, data) {
                console.log(result, data);

                ok(true);
                done2();
            });

            promise.fail(function(result, data) {
                console.log(result, data);
                ok(false);
            });
        });

        // Category promise from module singleton
        QUnit.test("Category promise, with valid URL module singleton", function(assert) {
            var url = "http://ge.com",
                done1 = assert.async(),
                done2 = assert.async(),
                promise = alchemy.alchemyCategoryLookupEx(url);

            ok(promise);

            promise.always(function(result, data) {
                console.log(result, data);
                strictEqual(data.status, config.okStatus, "Status must be OK");
                done1();
            });
            promise.done(function() {
                ok(true);
                done2();

            });
            promise.fail(function() {
                ok(false);
                done2();
            });
        });

        // Category promise with an invalid URL and no cache causes rejection
        QUnit.test("Category promise, with invalid URL", function(assert) {
            var url = "www.thiswebsitedoesnotexist123123123.com",
                done1 = assert.async();

            var templateObject = alchemy.alchemyCategoryObject(),
                promise = templateObject.getData(url);

            ok(promise);

            promise.fail(function(result, data) {
                strictEqual(data.status, config.errorStatus, "Status must be an error in this failed promise");
                done1();
            });

            promise.done(function(result, data) {
                ok(false);
                done1();
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
                start();

                equal(result.title, randomString,"Chrome found the bookmark we created");
                chrome.bookmarks.search(bookmark, function(results) {
                    ok(results.length);

                    chrome.bookmarks.remove(results[0].id, $.noop);
                });
            });

            promise.fail(function() {
                start();

                ok(false);
            });
        });

        // Create a folder twice, and verify only one instance exists
        QUnit.test("Chrome API - create a folder only if it does not exist", function(assert) {
            var randomString = Math.floor(Math.random() * 100).toString(),
                done1 = assert.async();

            var promise = crossbrows.createFolderIfNotExists(randomString).done(function(result) {
                console.log("Folder created", result);
                crossbrows.createFolderIfNotExists(randomString)
            });

            var query = {
                title: randomString
            };

            promise.done(function(result) {
                chrome.bookmarks.search(query, function(results) {
                    strictEqual(results.length, 1,"Chrome found only one created folder");

                    chrome.bookmarks.remove(results[0].id, $.noop());

                    done1();
                });
            });

            promise.fail(function() {
                done1();
            });

        });

        // Search bookmarks via a promise
        QUnit.asyncTest("Chrome API - search bookmarks (including folders) and return a promise", function() {
            var randomString = Math.floor(Math.random() * 100).toString();

            var bookmark = {
                title: randomString
            };

            chrome.bookmarks.create(bookmark, function(result) {
                var promise = chromex.findFolder(randomString)

                promise.always(function(results) {
                    start();
                    equal(results[0].title, randomString, "We found the bookmark that we created via a promise.");
                    chrome.bookmarks.remove(results[0].id, $.noop);
                });
            });
        });

        QUnit.module("Cross browser helper functions");

        QUnit.test("Get a bookmarks subtree", function(assert) {
            var done1 = assert.async();

            var promise = crossbrows.bookmarksSubTree();

            promise.always(function(results) {
                ok(results);
                done1();
            });
        });

        QUnit.test("Convert a tree to divs", function(assert) {
            ok(0);

        });

        QUnit.test("Sort a bookmark", function(assert) {
            var done1 = assert.async(),
                bookmark = {
                    title: "GE Careers",
                    url: "http://www.ge.com/careers"

                };

            chrome.bookmarks.create(bookmark, function(result) {
                var promise = SmartBookmarkSorter.sortBookmarkEx(result);

                promise.always(function(results) {
                    ok(results);
                    done1();
                });
            });

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