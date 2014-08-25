/**
 * Created by kotarf on 8/24/14.
 */
define(["jquery", "jquery.total-storage", "jquery.whensync"], function($) {
    /******* JQUERY HELPERS*******/

    return {
        /**
         * Make a REST request with JQuery. Wraps around JQuery
         * @param {string} requestURL The endpoint request URL
         * @param {object} data The data to send
         * @param {function} callback The callback to run after request completes
         * @param {string} dataType The data type to return back
         */
        jqueryRESTEx: function (requestURL, data, callback, dataType) {
            return jQuery.get(requestURL, data, callback, dataType);
        },

        /**
         * Make a REST request with JQuery. Wraps around JQuery
         * @param {string} requestURL The endpoint request URL
         * @param {object} data The data to send
         * @param {function} callback The callback to run after request completes
         * @param {string} dataType The data type to return back
         */
        jqueryREST: function (requestURL, data, callback, dataType) {
            jQuery.get(requestURL, data, callback, dataType);
        },

        /**
         * Get value from local storage using JQuery plugin totalStorage.
         * @param {string} key The key to look in
         * @returns {?} The value at the given key
         */
        jQueryStorageGetValue: function (key) {
            return $.totalStorage(key);
        },

        /**
         * Set value in local storage using JQuery plugin totalStorage.
         * @param {string} key The key to set at
         * @param {string} value The value to set
         */
        jQueryStorageSetValue: function (key, value) {
            $.totalStorage(key, value);
        },

        /**
         * Executes arbitrary number of asynchronous callbacks in sequence
         * @param {object} scope The scope to execute the functions in
         * @param {array} functions Array of functions to execute
         */
        jQueryWhenSync: function (scope, functions) {
            return $.whenSync.apply(scope, functions);
        }
    }
});