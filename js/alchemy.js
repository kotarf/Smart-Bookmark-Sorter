/**
 * Created by kotarf on 8/24/14.
 */
/******* ALCHEMY API *******/
define(["jqueryhelpers"], function($) {
    return {
        /**
         * Make an Alchemy API key test that runs callbackA if the key is valid, and runs callbackB if the key is not valid. Assumes google.com is operational :)
         * This code is particularly bad and needs to be replaced with using the regular functions below
         * @param {string} apiKey The apikey to make the request with
         * @param {function} callbackA The function to run if the test succeeds
         * @param {function} callbackB The function to run if the test fails
         * @param {array} argsA The arguments to the first callback
         * @param {array} argsB The arguments to the second callback
         * @param {object} scope The scope of the object to run the callbacks in
         * @config {string} [outputMode] Output mode for the request (like json)
         * @config {string} [requestCategoryURL] Endpoint for Alchemy category requests
         */
        alchemyKeyTest : function (apiKey, callbackA, callbackB, argsA, argsB, scope) {
            //Create a local data object for the API request
            var url = "http://www.google.com",
                me = this;

            var data = {
                url: url,
                apikey: apiKey,
                outputMode: this.config.outputMode
            };

            var dataType = "json";
            var requestURL = this.config.requestCategoryURL;

            var apiCallback = function (data, textStatus, jqXHR) {
                data.statusInfo === "invalid-api-key" ? callbackB.apply(argsB, scope) : callbackA.apply(argsA, scope);
            };
            //API request for getting the category of a URL
            me.jqueryREST(requestURL, data, apiCallback, dataType);
        },

        /**
         * Make an Alchemy API categorization request that runs the callback when complete
         * @param {string} url The url to categorize
         * @param {function} callback The function to run with the result
         * @config {string} [outputMode] Output mode for the request (like json)
         * @config {string} [requestCategoryURL] Endpoint for Alchemy category requests
         */
        alchemyCategory : function (url, callback) {
            // Get the api key from local storage
            var me = this,
                apikey = me.getApiKey();

            // Create a local data object for the API request
            var data = {
                url: url,
                apikey: apikey,
                outputMode: me.config.outputMode
            };

            var dataType = "json";
            var requestURL = me.config.requestCategoryURL;

            // API request for getting the category of a URL
            me.jqueryREST(requestURL, data, callback, dataType);
        }
        ,

        /**
         * Make an Alchemy API title request that runs the callback when complete
         * @param {string} url The url to extract title
         * @param {function} callback The function to run with the result
         * @config {string} [outputMode] Output mode for the request (like json)
         * @config {string} [requestTitleURL] Endpoint for Alchemy category requests
         */
        alchemyTitle : function (url, callback) {
            // Get the api key from local storage
            var me = this,
                apikey = me.getApiKey();

            //Create a local data object for the API request
            var data = {
                url: url,
                apikey: apikey,
                outputMode: me.config.outputMode
            };

            var dataType = "json";
            var requestURL = me.config.requestTitleURL;

            //API request for getting the category of a URL
            me.jqueryREST(requestURL, data, callback, dataType);
        }
    }
});