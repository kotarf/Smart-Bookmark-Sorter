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
         * Search for folders with the specified title
         * As of chrome version ___, these API calls include folders
         * @param {string} title The search title
         * @return {promise} dfd A promise to search bookmarks for the given query
         */
        findFolder: function (title) {
            var dfd = $.Deferred(),
                queryObj = {
                    title: title
                };

            chrome.bookmarks.search(queryObj, function(results) {
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
         * Move a bookmark
         * @param {object} bookmark The bookmark that was moved.
         * @return {promise} A promise to move a bookmark.
         */
        moveBookmark: function (id, destination) {
            var dfd = $.Deferred(),
                move = {
                    parentId: destination
                };

            chrome.bookmarks.move(id, move, function(result) {
                dfd.resolve(result);
            });

            return dfd.promise();
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
         * Attach bookmark move event
         * @param {function} callback The listener to attach
         * **/
        chromeBookmarkOnMove: function (callback) {
            chrome.bookmarks.onMoved.addListener(callback);
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
         * @param {string} id The id to grab a subtree for
         * @return {promise} dfd A promise to get a bookmarks subtree
         */
        chromeGetSubTree: function (id) {
            var dfd = $.Deferred();

            chrome.bookmarks.getSubTree(id, function(results) {
                if(results.length)
                {
                    dfd.resolve(results);
                }
                else
                {
                    dfd.reject();
                }
            });

            return dfd.promise();
        },

        /**
         * Get the bookmarks tree
         * @return {promise} dfd A promise to get all bookmarks
         */
        chromeGetTree: function () {
            var dfd = $.Deferred();

            chrome.bookmarks.getTree(function(results) {
                if(results.length)
                {
                    dfd.resolve(results);
                }
                else
                {
                    dfd.reject();
                }
            });

            return dfd.promise();
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