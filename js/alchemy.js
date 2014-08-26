/**
 * Created by kotarf on 8/24/14.
 */
/******* ALCHEMY API *******/
define(["underscore", "jqueryhelpers", "storage", "config"], function(_, jhelpers, storage, config) {

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
                outputMode: config.outputMode
            };

            var dataType = "json";
            var requestURL = config.requestCategoryURL;

            var apiCallback = function (data, textStatus, jqXHR) {
                data.statusInfo === "invalid-api-key" ? callbackB.apply(argsB, scope) : callbackA.apply(argsA, scope);
            };
            //API request for getting the category of a URL
            jhelpers.jqueryREST(requestURL, data, apiCallback, dataType);
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
            console.log("Alchemy Category");
            var me = this,
                apikey = storage.getApiKey();

            // Create a local data object for the API request
            var data = {
                url: url,
                apikey: apikey,
                outputMode: config.outputMode
            };

            var dataType = "json";
            var requestURL = config.requestCategoryURL;
            console.log("category request", requestURL, data, callback)
            // API request for getting the category of a URL
            jhelpers.jqueryREST(requestURL, data, callback, dataType);
        },

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
                apikey = storage.getApiKey();

            //Create a local data object for the API request
            var data = {
                url: url,
                apikey: apikey,
                outputMode: config.outputMode
            };

            var dataType = "json";
            var requestURL = config.requestTitleURL;

            //API request for getting the category of a URL
            jhelpers.jqueryREST(requestURL, data, callback, dataType);
        },

        alchemyRequest: function(url, requestUrl) {
            // Get the api key from local storage
            var me = this,
                apikey = storage.getApiKey();

            //Create a local data object for the API request
            var data = {
                url: url,
                apikey: apikey,
                outputMode: config.outputMode
            };

            var dataType = "json";

            //API request for getting the category of a URL
            return jhelpers.jqueryRESTx(requestURL, data, dataType);
        },

        alchemyCategoryObject : function()
        {

        },

        //TODO figure out how to use template method to have category, title, and concept lookups share code
        alchemyCategoryLookupEx : function(url, type)
        {
            var categorylookup = new AlchemyLookupObject();
        },

        AlchemyLookupObject : {
            AlchemyLookupObject: function(request, preprocess, accept, resultprop, cache) {
                this.request = request;
                this.preproc = preprocess;
                this.accept = accept;
                this.resultprop = resultprop;
            },

            request : $.noop, // request function to use
            preproc : $.noop, // pre processing on input url
            accept : $.noop, // given the result data, do you accept it?
            resultprop : {}, // result property of the JSON data
            cachefunct: $.noop,

            cache: function(url) {
                var me = this,
                    def = $.Deferred(),
                    newUrl = me.preproc(url);

                return me.cache(newUrl);
            },

            lookup: function(url) {
                var me = this,
                    def = $.Deferred(), //we will resolve this when next is done
                    newUrl = me.preproc(url);

                var cacheData = me.cache(newUrl);

                if(_.isUndefined(cachedData)) {
                    me.request(newUrl).done(function (data) {
                        if (me.accept(data)) {
                            var result = data[me.resultprop];

                            def.resolve(result);
                        }
                        else {
                            def.reject();
                        }
                    });
                }
                else
                {
                    def.resolve(cacheData[this.resultprop]);
                }

                return def.promise();
            }
        },

        /**
         * Makes an Alchemy API request to check the category if it is not already cached
         * TODO merge category and title functions together
         * @param {string} url The url to lookup.
         * @param {function} callback The callback to run after the REST request completes.
         */
        alchemyCategoryLookup : function (url, callback)
        {
            var me = this,
                cachedData = jhelpers.jQueryStorageGetValue(url),
                baseUrl = jhelpers.getBaseUrl(url);

            // Check if there is cached data
            if(cachedData === null || cachedData.category === undefined) {
                console.log("Making a CATEGORY request for - ", url);

                // If not, make an API request.
                me.alchemyCategory(url, function(data, textStatus, jqXHR) {

                    var category = data.category,
                        status = data.status,
                        statusInfo = data.statusInfo,
                        score = data.score;

                    // Check the status first
                    if (status === config.okStatus && score && category) {
                        // If the score of the result is horrible, redo the whole thing using the baseUrl (if not already using it)
                        score = data.score;

                        if (score < config.categoryErrorScore && baseUrl !== url ) {
                            // Redo the categorization with the base URL because the result was not good enough
                            console.log("*** REDOING CAT ON SCORE *** with baseUrl = ", baseUrl, " and category ", category);

                            // Cache it as a redo
                            me.cacheCategory(cachedData, url, config.redoCode);

                            me.alchemyCategoryLookup(baseUrl, callback);

                        } else {
                            // Cache the category
                            me.cacheCategory(cachedData, url, category);

                            // Invoke the callback
                            callback.call(me, category);
                        }
                    } else {
                        // Error handling
                        console.log("*****ERROR CAT********= ", data, " for url = " , url);
                        if(statusInfo === config.dailyLimitError) {
                            // Daily limit reached must stop the chain
                            chromex.chromeSendMessage(config.dailyLimitError);
                        } else if (baseUrl !== url) {
                            // Otherwise the page isn't HTML- fall back on the base URL.
                            console.log("*** REDOING CAT ON ERROR *** with baseUrl = ", baseUrl);
                            // Cache the redo
                            me.cacheCategory(cachedData, url, config.redoCode);
                            // Redo
                            me.alchemyCategoryLookup(baseUrl, callback);
                        } else {
                            // Cannot read this page- resolve with Unsorted after caching as unsorted
                            category = config.unsortedFolderName;

                            // Cache the category
                            me.cacheCategory(cachedData, url, category);

                            // Invoke the callback
                            callback.call(me, category);
                        }
                    }
                });
            } else {
                // Cached category
                var category = cachedData.category;

                // If a Redo is cached, call it with the baseUrl
                if (category === config.redoCode) {
                    me.alchemyCategoryLookup(baseUrl, callback);
                } else {
                    // Invoke the callback
                    callback.call(me, category);
                }
            }
        },

        /**
         * Makes an Alchemy API request to check the title if it is not already cached
         * @param {string} url The url to lookup.
         * @param {function} callback The callback to run after the REST request completes.
         */
        alchemyTitleLookup : function (url, callback) {
            // Check local cache to see if the base URL has associated data.
            console.log("title lookup", jhelpers, url, callback);
            var me = this,
                baseUrl = jhelpers.getBaseUrl(url),
                cachedData = jhelpers.jQueryStorageGetValue(baseUrl);

            // If not, make an API request.
            if(cachedData === null || cachedData.title === undefined)
            {
                console.log("Making a TITLE request for - ", url);
                me.alchemyTitle(baseUrl, function(data, textStatus, jqXHR) {

                    var title = data.title,
                        category = undefined,
                        status = data.status,
                        statusInfo = data.statusInfo;

                    // Check the status first
                    if (status === config.okStatus && title) {

                        // Cache the title
                        me.cacheTitle(cachedData, baseUrl, title);

                        // Invoke the callback
                        callback.call(me, title);
                    } else {
                        // Error handling
                        console.log("*****ERROR TITLE********= ", data, " for url = " , url);
                        if(statusInfo === config.dailyLimitError) {
                            // Daily limit reached must stop the chain
                            chromex.chromeSendMessage(config.dailyLimitError);
                        } else {
                            // Cannot read this page- resolve with Unsorted after caching as unsorted
                            title = config.unsortedFolderName;

                            // Cache the title
                            me.cacheTitle(cachedData, baseUrl, title);

                            // Invoke the callback
                            callback.call(me, title);
                        }
                    }
                });
            }
            else
            {
                // Cached title
                var title = cachedData.title;

                // Invoke the callback
                callback.call(me, title);
            }
        },

        /**
         * Store the title (value) by the url (key)
         * This could be refactored along with with half of my code
         * @param {object} cachedData The cachedData object that was retrieved
         * @param {string} url The url to store by
         * @param {string} title The title to store
         */
        cacheTitle : function(cachedData, url, title) {
            // Category data may already exist
            var category = undefined,
                me = this;

            if(cachedData !== null) {
                category = cachedData.category;
            }

            // Cache the title in local storage
            jhelpers.jQueryStorageSetValue(url, {title: title, category: category});
        },

        /**
         * Store the category (value) by the url (key)
         * @param {object} cachedData The cachedData object that was retrieved
         * @param {string} url The url to store by
         * @param {string} category The category to store
         */
        cacheCategory : function(cachedData, url, category) {
            // Title data may already exist
            var title = undefined,
                me = this;

            if(cachedData !== null) {
                title = cachedData.title;
            }

            // Cache the category in local storage
            jhelpers.jQueryStorageSetValue(url, {title: title, category: category});
        }
    };
});