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
        alchemyKeyTest : function (apiKey) {
            //Create a local data object for the API request
            var url = "http://www.google.com",
                me = this;

            var data = {
                url: url,
                apikey: apiKey,
                outputMode: config.outputMode
            };

            var dataType = "json",
                requestURL = config.requestCategoryURL,
                dfd = $.Deferred();

            var apiCallback = function (data, textStatus, jqXHR) {
                data.status === "ERROR" ? dfd.reject(data) : dfd.resolve(data);
            };

            // API request for getting the category of a URL
            jhelpers.jqueryRESTx(requestURL, data, apiCallback, dataType);

            return dfd.promise();
        },

        /**
         * Make an Alchemy API categorization request that runs the callback when complete
         * @param {string} url The url to categorize
         * @param {function} callback The function to run with the result
         * @config {string} [outputMode] Output mode for the request (like json)
         * @config {string} [requestCategoryURL] Endpoint for Alchemy category requests
         */
        alchemyCategory : function (url) {
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

            var dataType = "json",
                requestURL = config.requestCategoryURL;

            console.log("category request", requestURL, data, callback)

            // API request for getting the category of a URL
            return jhelpers.jqueryRESTx(requestURL, data, $.noop(), dataType);
        },

        /**
         * Make an Alchemy API title request that runs the callback when complete
         * @param {string} url The url to extract title
         * @param {function} callback The function to run with the result
         * @config {string} [outputMode] Output mode for the request (like json)
         * @config {string} [requestTitleURL] Endpoint for Alchemy category requests
         */
        alchemyTitle : function (url) {
            // Get the api key from local storage
            var me = this,
                apikey = storage.getApiKey();

            //Create a local data object for the API request
            var data = {
                url: url,
                apikey: apikey,
                outputMode: config.outputMode
            };

            var dataType = "json",
                requestURL = config.requestTitleURL;

            //API request for getting the category of a URL
            return jhelpers.jqueryRESTx(requestURL, data, callback, dataType);
        },

        alchemyRequest: function(requestUrl, url) {
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

            // API request for getting the category of a URL
            return jhelpers.jqueryRESTx(requestUrl, data, dataType);
        },

        AlchemyObject : {
            AlchemyObject: function(request, preprocess, accept, resultprop, cache) {
                this.request = request;
                this.preproc = preprocess;
                this.accept = accept;
                this.resultprop = resultprop;
                this.cache = cache;
            },

            request : $.noop, // request function to use
            preproc : function(url) { return url; }, // pre processing on input url
            accept : $.noop, // given the result data, do you accept it?
            resultprop : {}, // result property of the JSON data
            cache: $.noop,

            getData: function(url) {
                var me = this,
                    def = $.Deferred(), //we will resolve this when next is done
                    newUrl = me.preproc(url);

                var cacheData = me.cache(newUrl, me.resultprop);

                if(_.isEmpty(cacheData)) {
                    me.request(newUrl).done(function (data) {
                        var status = data.status;
                        if(status === config.okStatus)
                        {
                            if (me.accept(data)) {
                                var result = data[me.resultprop];

                                me.cache(newUrl, me.resultprop, result);

                                def.resolve({result: result, data:data});
                            }
                            else
                            {
                                def.reject({data: data});
                            }
                        }
                        else
                        {
                            def.reject({data: data});
                        }
                    });
                }
                else
                {
                    console.log("Cached data is", cacheData);
                    def.resolve({result: cacheData[me.resultprop]});
                }

                return def.promise();
            },



            lookup: function(url)
            {
                var promise = getData(url),
                    dfd = $.Deferred(),
                    me = this;

                promise.done(function(data) {
                    // resolve the deferred object
                    var text = data[me.resultprop];
                    dfd.resolve(text);

                }).fail(function(data) {
                    var status = data.status,
                        statusInfo = data.statusInfo;

                    // if status is ok, redo on baseUrl for better score
                    if(status === config.okStatus)
                    {

                    }
                    // status is not ok
                    if(status === config.errorStatus)
                    {
                        // we have reached our daily limit
                        if(statusInfo === config.dailyLimitError)
                        {
                            dfd.fail(statusInfo);
                        }
                        // the page is not html (is an image)
                        else if(statusInfo === config.pageNotHtmlError)
                        {
                            // Template override
                            // Cache as a redo


                            // Redo with baseUrl
                        }
                        else
                        {
                            // Exhausted all options- store as "unsorted"
                            var ret = config.unsortedFolderName;

                            // Cache the result as unsorted
                            me.cachefunct(undefined, url, config.unsortedFolderName);

                            df.resolve(config.unsortedFolderName);
                        }

                    }

                });

                // Return a promise to get the category or title of a URL from either the cache or the alchemy service
                return dfd.promise();

            }
        },


        /*
            var promise = lookup(url);
            promise.done(...).fail(...)
            //.fail(if status == ok, if status == dailyLimitError,

            alchemyCategoryLookup : function(url, callback)
            {
                // If no cached data
                    // Request
                        // If status is ok
                            // If score acceptable

                            // Else
                                <Template>

                        // Else

                // Else use cache data

            }

         */


        alchemyCategoryObject : function()
        {
            var request = _.partial(this.alchemyRequest, config.requestCategoryURL);
            var accept = function(data) {
                return data.score > config.categoryErrorScore;
            };
            var me = this;

            var categoryObject = Object.create(this.AlchemyObject, {
                request: {
                    value: request
                },
                accept: {
                    value:accept
                },
                resultprop: {
                    value:config.categoryProperty
                },
                cache: {
                    value:me.cache
                }
            });

            return categoryObject;
        },

        //TODO figure out how to use template method to have category, title, and concept lookups share code
        alchemyCategoryLookupEx : function(url, type)
        {
            var categorylookup = new AlchemyLookupObject();
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

        cache: function(url, property, data)
        {
            var cachedData = jhelpers.jQueryStorageGetValue(url) || {};

            if(property && data)
            {
                cachedData[property] = data;

                jhelpers.jQueryStorageSetValue(url, cachedData);
            }

            return cachedData;
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

            if(_.isNull(cachedData))
            {
                cachedData = jhelpers.jQueryStorageGetValue(url);
            }

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

            if(_.isNull(cachedData))
            {
                cachedData = jhelpers.jQueryStorageGetValue(url);
            }

            if(cachedData !== null) {
                title = cachedData.title;
            }

            // Cache the category in local storage
            jhelpers.jQueryStorageSetValue(url, {title: title, category: category});
        }
    };
});