/**
 * Created by kotarf on 8/24/14.
 */
/******* CHROME CONTROL *******/
/*
 * @param {string} parentId The optional parentId to search for
 * @param {string} name The name of the folder(s) to search for
 * @param {function} deferred The deferred object to resolve when successful

 */
define(["jquery"], function($){
    return {
        searchFolders: function (parentId, name, deferred) {
            var me = this;
            console.log("MAJOR PROBLEMS", name, parentId, deferred);
            chrome.bookmarks.search(name, function (results) {

                if (_.isArray(results)) {
                    var nodes = _.filter(results, function (node) {
                        return $.isEmptyObject(node.url);
                    });

                    deferred.resolve(nodes);
                }
                else {
                    deferred.fail();
                }
            });
        },

        /**
         * Recurses through the bookmark tree looking for bookmarks that pass the test
         * Needed because chrome.bookmarks.search() does not include folders in the result.
         * This code is very broken!
         * @param {string} parentId The optional parentId to search for
         * @param {function} test The function to test on a BookmarkTreeNode element
         * @param {function} callback The callback to run with the results
         */
        searchFoldersEx: function (parentId, test, callback) {
            var me = this;
            var ret = [];

            function testBookmarks(bookmarks) {
                me.forEach(bookmarks, function (bookmark) {

                    if (test.call(me, bookmark)) {
                        ret.push(bookmark);
                    }

                });

                return ret;
            }

            me.getOtherBookmarks(function (result) {
                var searchParentId = parentId || result.id;

                me.getBookmarkChildren(searchParentId, function (bookmarks) {
                    var ret = testBookmarks(bookmarks);
                    callback.call(me, ret);
                });
            });
        },

        /**
         * Get other bookmarks folder
         * @param {function} callback The callback to run with the other bookmarks folder
         * @config {function} [rootBookmarksIndex] key for root bookmarks index in local storage
         * @config {function} [otherBookmarksIndex] key for otherbookmarks index in local storage
         */
        getOtherBookmarks: function (callback) {
            // Get the ID of other bookmarks folder
            var me = this;
            me.getBookmarkChildren(me.config.rootBookmarksIndex.toString(), function (results) {
                var otherBookmarks = results[me.config.otherBookmarksIndex];
                callback.call(me, otherBookmarks);
            });
        },

        /**
         * Search bookmarks with query
         * Does not return folders
         * @param {string} query The callback to run with the other bookmarks folder
         * @param {function} callback The callback to run with the results of the search
         */
        searchBookmarks: function (query) {
            var dfd = $.Deferred();

            chrome.bookmarks.search(query, function(results) {
                if(results === undefined || results.length === 0)
                {
                    dfd.reject(results);
                }
                else
                {
                    dfd.resolve(results);
                }
            });

            return dfd.promise();
        },

        /**
         * Get all children bookmarks at id
         * @param {string} id The id of parent
         * @param {function} callback The callback to run with the child bookmarks
         */
        getBookmarkChildren: function (id, callback) {

            chrome.bookmarks.getChildren(id, callback);
        },

        /**
         * Removes a bookmark with the given ID.
         * @param {string} id The id of the bookmark to remove
         * @param {function} callback The callback to run after removing
         */
        removeBookmark: function (id, callback) {
            chrome.bookmarks.remove(id, callback);
        },

        /**
         * Removes all folders with the given name. Particularly useful in testing and damage control.
         * @param {string} name The name of the folder(s) to remove
         * @ignore
         */
        removeBookmarks: function (name) {
            var me = this;
            me.searchFolders(function (bookmark) {
                return bookmark != undefined && bookmark.title == name;
            }, function (ret) {
                me.forEach(ret, function (bookmark) {
                    chrome.bookmarks.remove(bookmark.id, function () {
                    });
                });
            });
        },

        /**
         * Get all children bookmarks at id
         * @param {string} id The id of parent
         * @param {object} destination The destination to move to (chrome api specified)
         * @param {function} callback The callback to run after moving the bookmark
         */
        moveBookmark: function (id, destination, callback) {
            chrome.bookmarks.move(id, destination, callback);
        },

        /**
         * Create a bookmark or folder
         * @param {object} bookmark The bookmark to create
         * @return {promise} A promise to create a bookmark or folder.
         */
        createBookmark: function (bookmark) {
            var dfd = $.Deferred();

            chrome.bookmarks.create(bookmark, function(result) {
                dfd.resolve(result);
            });

            return dfd.promise();
        },

        /**
         * Attach bookmark create event
         * @param {function} callback The listener to attach
         */
        chromeBookmarkOnCreated: function (callback) {
            chrome.bookmarks.onCreated.addListener(callback);
        },

        /**
         * Detach bookmark create event
         * @param {function} callback The listener to detach
         */
        chromeBookmarksDetachCreated: function (callback) {
            chrome.bookmarks.onCreated.removeListener(callback);
        },

        /**
         * Attach on visited event
         * @param {function} callback The listener to attach
         */
        chromeHistoryOnVisited: function (callback) {
            chrome.history.onVisited.addListener(callback);
        },

        /**
         * Detach on visited event
         * @param {function} callback The listener to detach
         */
        chromeHistoryDetachVisited: function (callback) {
            chrome.history.onVisited.removeListener(callback);
        },

        /**
         * Attach on an alarm
         * @param {string} name The name of the alarm
         * @param {function} callback The listener to attach
         * @param {double} interval The interval to attach in minutes
         */
        chromeDeployAlarm: function (name, callback, interval) {
            chrome.alarms.create(name, {periodInMinutes: interval});
            chrome.alarms.onAlarm.addListener(callback);
        },

        /**
         * Detach an alarm by name
         * @param {string} name The name of the alarm listener to detach
         */
        chromeAlarmsDetach: function (name) {
            chrome.alarms.clear(name);
        },

        /**
         * Clear all alarms
         */
        chromeClearAlarms: function (name) {
            chrome.alarms.clearAll();
        },

        /**
         * Get visit information by URL
         * @param {string} url The url to search history for
         * @param {function} callback The callback to run with visit results
         */
        chromeGetVisits: function (url, callback) {
            chrome.history.getVisits({url: url}, callback);
        },

        /**
         * Get subtree by id
         * @param {string} id The id to grab a subtree
         * @param {function} callback The callback to run with visit results
         */
        chromeGetSubTree: function (id, callback) {
            chrome.bookmarks.getSubTree(id, callback);
        },

        /**
         * Send a message to the rest of the extension
         * @param {string} message The message to send
         */
        chromeSendMessage: function (message) {
            chrome.runtime.sendMessage(message);
        },

        /**
         * Attach on import begin event
         * @param {function} callback The listener to attach
         */
        chromeOnImportBegan: function (callback) {
            chrome.bookmarks.onImportBegan.addListener(callback);
        },

        /**
         * Attach on import end event
         * @param {function} callback The listener to detach
         */
        chromeOnImportEnd: function (callback) {
            chrome.bookmarks.onImportEnded.addListener(callback);
        }
    };
});