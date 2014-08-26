define(["jquery", "underscore", "sortapi", "alchemy", "storage" ], function($, _, SmartBookmarkSorter, alchemy, storage) {

    return function(chrome) {

        QUnit.begin(function () {
            storage.setApiKey("");
        });

        test("test", function () {
            ok(1 == "1", "Passed!");
        });

        asyncTest("Category request is successfully made", 1, function () {

            var callback = function (data, textStatus, jqXHR) {
                var category = data.category,
                    status = data.status,
                    statusInfo = data.statusInfo,
                    score = data.score;

                equal(category, "recreation");
                start();
            };

            alchemy.alchemyCategory("http://stackoverflow.com", callback);
        });

        asyncTest("Title request is successfully made", 1, function () {

            var callback = function (data, textStatus, jqXHR) {
                var title = data.title,
                    status = data.status,
                    statusInfo = data.statusInfo,
                    score = data.score;

                equal(title, "Stack Overflow");
                start();
            };

            alchemy.alchemyTitle("http://stackoverflow.com", callback);
        });


        asyncTest("A single bookmark is sorted", 2, function () {
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

        QUnit.done(function () {
            var items = $.totalStorage.getAll();

            for (var i = 0; i < items.length; ++i) {
                $.totalStorage.deleteItem(items[i].key);
            }
        });
    };
});
