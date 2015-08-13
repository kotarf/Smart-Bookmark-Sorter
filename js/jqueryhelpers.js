/**
 * Created by kotarf on 8/24/14.
 */
define(["jquery", "lib/jquery.total-storage", "lib/jquery.whensync"], function($) {
    return {
        /**
         * Make a REST request with JQuery. Wraps around JQuery
         * @param {string} requestURL The endpoint request URL
         * @param {object} data The data to send
         * @param {string} dataType The data type to return back
         * @returns {promise} Returns a promise
         */
        jqueryRESTx: function (requestURL, data, callback, dataType) {
            return $.get(requestURL, data, callback, dataType);
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
        },

        /**
         * Get the base url of a qualified URL
         * @param {string} url The qualified url to slice
         * @returns {string}
         */
        getBaseUrl : function (url)
        {
            var urlObj = $.url(url);
            var host = urlObj.attr('host');
            var protocol = urlObj.attr('protocol');
            return protocol + '://' + host;
        }
    }
});