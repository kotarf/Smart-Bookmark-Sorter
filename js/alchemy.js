/**
 * Created by kotarf on 8/24/14.
 */
/******* ALCHEMY API *******/
define(["underscore", "jqueryhelpers", "storage", "config"], function(_, jhelpers, storage, config) {

    return {

        /**
         * Make an Alchemy API key test that runs callbackA if the key is valid, and runs callbackB if the key is not valid. Assumes google.com is operational :)
         * @param {string} apiKey The apikey to make the request with
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
         */
        alchemyCategory : function (url) {
            var requestURL = config.requestCategoryURL;

            // API request for getting the category of a URL
            return this.alchemyRequest(requestURL, url);
        },

        /**
         * Make an Alchemy API concept request that runs the callback when complete
         * @param {string} url The url to extract title
         */
        alchemyTaxonomy : function (url) {
            var requestURL = config.requestTaxonomyURL;

            // API request for getting the concepts of a URL
            return this.alchemyRequest(requestURL, url);
        },

        AlchemyObject : {
            AlchemyObject: function(request, accept, resultprop, preprocess) {
                this.request = request;
                this.accept = accept;
                this.resultprop = resultprop;
                this.preproc = preprocess;
            },

            request : $.noop, // request function to use
            preproc : function(url) { return url; }, // pre processing on input url
            accept : function(url) { return true; }, // given the result data, do you accept it?
            resultprop : {}, // result property of the JSON data

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

            /**
             * Returns AlchemyAPI results for the given url, using the object's request function
             * @param {string} url The url to extract data for
             */
            getData: function(url) {
                var me = this,
                    def = $.Deferred(), //we will resolve this when next is done
                    newUrl = me.preproc(url);

                me.request(newUrl).done(function (data) {
                    var status = data.status,
                        statusInfo = data.statusInfo,
                        result = data[me.resultprop];

                    if(status === config.okStatus)
                    {
                        if (me.accept(data)) {

                            def.resolve(result, data);
                        }
                        else
                        {
                            // Failures on score are resolved to unsorted /// TODO add retry on low score
                            def.resolve(config.unsortedFolderName, data);
                        }
                    }

                    // status is not ok
                    else
                    {
                        // we have reached our daily limit
                        if(statusInfo === config.dailyLimitError || statusInfo === config.invalidApiKeyError)
                        {
                            def.reject(result, data);
                        }
                        else
                        {
                            // Unknown (but benign)- resolve as "unsorted" /// TODO add retry on invalid html
                            def.resolve(config.unsortedFolderName, data);
                        }
                    }
                });

                return def.promise();
            },
        },

        alchemyCategoryObject : function()
        {
            var accept = function(data) {
                return true;
            };
            var me = this;

            var categoryObject = Object.create(this.AlchemyObject, {
                request: {
                    value: me.alchemyCategory
                },
                accept: {
                    value:accept
                },
                resultprop: {
                    value:config.categoryProperty
                }
            });

            return categoryObject;
        },

        alchemyTaxonomyObject : function()
        {
            var accept = function(data) {
                console.log("Taxonomy raw data", data);

                if(!data.taxonomy || !data.taxonomy[0]) {
                    console.log("No taxonomy in data", data);
                    return false;
                }
                else {
                    return data.taxonomy[0].confident === "no" || data.taxonomy[0].score < config.taxonomyErrorScore ? false : true;
                }
            };
            var me = this;

            var taxonomyObject = Object.create(this.AlchemyObject, {
                request: {
                    value: me.alchemyTaxonomy
                },
                accept: {
                    value:accept
                },
                resultprop: {
                    value:config.taxonomyProperty
                }
            });

            return taxonomyObject;
        },

        alchemyCategoryLookupEx : function(url)
        {
            this.alchemyCategoryInstance = this.alchemyCategoryInstance || this.alchemyCategoryObject();

            return this.alchemyCategoryInstance.getData(url).promise();
        },

        alchemyTaxonomyLookupEx : function(url)
        {
            this.alchemyTaxonomyInstance = this.alchemyTaxonomyInstance || this.alchemyTaxonomyObject();

            return this.alchemyTaxonomyInstance.getData(url).promise();
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
        }
    };
});