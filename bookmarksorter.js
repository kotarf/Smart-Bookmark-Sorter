// Smart Bookmark Sorter is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Smart Bookmark Sorter is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Smart Bookmark Sorter. If not, see <http://www.gnu.org/licenses/>.

/******* BOOKMARK SORTER *******/

(function(global) {
	global.SmartBookmarkSorter = {
		/** SmartBookmarkSorter configuration properties. These are all constants. */
		config : {
			requestCategoryURL : 		"http://access.alchemyapi.com/calls/url/URLGetCategory",
			requestTitleURL : 			"http://access.alchemyapi.com/calls/url/URLGetTitle",
			requestTopicURL : 			"http://access.alchemyapi.com/calls/url/URLGetRankedConcepts",
			apiStorageKey : 			"bookmarksort_apikey",
			oldBookmarkDaysKey : 		"bookmarksort_oldarchive",
			autoSortActiveKey : 		"bookmarksort_auto_on",
			autoSortCreateKey : 		"bookmarkauto_oncreate",
			autoSortTimedKey : 			"bookmarkauto_timed",
			autoSortPriorityKey : 		"bookmarkauto_priority",
			outputMode : 				"json",
			autoSortMinutes : 			1,
			indexCounter : 				"bookmarkIndexCounter",
			oldBookmarkDaysDefault : 	7,
			bookmarkAlarm : 			"bookmarkAlarm",
			rootBookmarksIndex : 		0,
			otherBookmarksIndex : 		1,
			sampleNumber : 				5,
			categoryErrorScore :		.7,
			unsortedFolderName :		"unsorted",
			dailyLimitError : 			"daily-transaction-limit-exceeded",
			domainError : 				"cannot-resolve-dns",
			timeoutError :				"operation-timeout",
			okStatus : 					"OK"
		},

		/**
		 * Enable the automatic create sort.
		 * Sorts bookmarks as they are created
		 */
		attachCreateSort : function () {
			/* When a bookmark is created, it will be moved to an appropriate Title folder." */
			this.chromeBookmarkOnCreated(this.onCreatedListener);
		},

		/**
		 * Enable the automatic timed sort.
		 * Sorts older bookmarks on a timed interval.
		 */
		attachIntervalSort : function () {
			/* On a timed interval, older bookmarks will be archived to a Category folder and loose bookmarks will be sorted. */
			this.chromeDeployAlarm(this.config.bookmarkAlarm, this.intervalAlarm, this.config.autoSortMinutes); 
		},

		/**
		 * Enable the automatic visit sort.
		 * Will send bookmarks to the top as they are accessed.
		 */
		attachVisitSort : function () {
			/*When visiting a URL, a matching bookmark will be moved up. <TODO?> If it's in an archive, it will be taken out. */
			this.chromeHistoryOnVisited(this.onVisitedListener);
		},

		/**
		 * Detaches the automatic create sort
		 */
		detachCreateSort : function () {
			this.chromeBookmarksDetachCreated(this.onCreatedListener);
		},

		/**
		 * Detaches the automatic interval sort
		*/
		detachIntervalSort : function () {
			this.chromeAlarmsDetach(this.config.bookmarkAlarm);
		},

		/**
		 * Detaches the automatic visit sort
		*/
		detachVisitSort : function () {
			this.chromeHistoryDetachVisited(this.onVisitedListener);
		},

		/**
		 * Enables automatic sort
		 * Checks local storage configuration values to determine which sorts to enable
		*/
		enableAutomaticSort : function () {
			var me = this,
				isOnCreate = me.getAutoOnCreate(),
				isOnInterval = me.getAutoInterval(),
				isPrioritize = me.getAutoPrioritize();

			if(isOnCreate)
				me.attachCreateSort();
			if(isOnInterval)
				me.attachIntervalSort();
			if(isPrioritize)
				me.attachVisitSort();
		},

		/**
		 * Disables automatic sort
		 * Drops all of the attached sorts
		*/
		disableAutomaticSort : function () {
			var me = this;
			me.detachCreateSort();
			me.detachIntervalSort();
			me.detachVisitSort();
		},

		/**
		 * Listener for the onCreated automatic sort
		 * @param {id} id The id of the bookmark that was just created.
		 * @param {bookmark} bookmark The bookmark that was just created.
		 */
		onCreatedListener : function (id, bookmark)
		{
			// Sort the bookmark by title
			console.log("Yay - ", bookmark);
			var me = this,
				SBS = me.SmartBookmarkSorter;
			SBS.sortBookmark(bookmark, function(){}, undefined);
		},

		/**
		 * Listener for the onVisited automatic sort
		 * Searches through bookmarks for a URL match
		 * @param {HistoryItem} result The HistoryItem of the URL that was visited.
		 */
		onVisitedListener : function (result)
		{
			var url = result.url,
				me = this,
				SBS = me.SmartBookmarkSorter;

			// Check if a matching bookmark exists
			SBS.searchBookmarks(url, function(results) {
				var result = results[0];

				// Matching bookmark to url exists
				if(result !==  undefined)
				{
					var id = result.id;	
					var parentId = result.parentId;

					// Move it to the top of other bookmarks
					SBS.getOtherBookmarks(function(result) {

						var otherBookmarksId = result.id;
											
						var destination = {
							parentId : otherBookmarksId,
							index : 0
						};
						
						SBS.moveBookmark(id, destination, function() {});
					});
				}
				// Otherwise, do nothing.
			});
		},

		/**
		 * Listener for the onInterval automatic sort
		 * Iterates through bookmarks on a timed interval, sorting older ones
		 * @param {Alarm} alarm The alarm to attach.
		 * @config {int} [oldBookmarkDays] Sort bookmarks that are older than this in days
		 * @config {int} [rootBookmarksIndex] Index of root bookmarks
		 * @config {int} [otherBookmarksIndex] Index of other bookmarks
		 */
		intervalAlarm : function (alarm)
		{
			// Get the local counter or start it at 0
			var me = this,
				SBS = me.SmartBookmarkSorter;
				counterKey = SBS.config.indexCounter,
				counterValue = SBS.jQueryStorageGetValue(counterKey) || 0;

			// Get the ID of other bookmarks folder
			SBS.getBookmarkChildren(SBS.config.rootBookmarksIndex.toString(), function(results) {
				var otherBookmarksId = results[SBS.config.otherBookmarksIndex].id;

				// Get the children of other Bookmarks
				SBS.getBookmarkChildren(otherBookmarksId, function(results) {
					// Get the bookmark at the current index
					var bookmark = results[counterValue];
					
					if(bookmark !== undefined) {				
						// Check if the URL hasn't been visited in a while
						var title = bookmark.title;
						var url = bookmark.url;
						var myId = bookmark.id;
						var baseUrl = SBS.getBaseUrl(url);

						// Could be a folder
						if(url !== undefined)
						{
							// Sort the bookmark if it's older than the configured amount
							SBS.sortIfOld(bookmark, me, function(){}, undefined);
						}
					}	
					// Otherwise, do nothing.
				
					// Set the counter to the next index, or 0 if it is the tail
					var incCounter = counterValue < results.length ? counterValue + 1 : 0;

					SBS.jQueryStorageSetValue(counterKey, incCounter);
				});
			});
		},

		/**
		 * Sorts a single bookmark
		 * Makes two folders and puts the bookmark in the 2nd folder
		 * @param {BookmarkTreeNode} bookmark The bookmark to sort.
		 * @param {function} callback The bookmark to sort.
		 * @param {object} deferred The deferred object to resolve [JQuery whenSync].
		 */
		sortBookmark : function (bookmark, callback, deferred) {
			var me = this;
	
			me.createFolderByCategory(bookmark.url, undefined, function(result) {
				me.createFolderByTitle(bookmark.url, result.id, function(result) {
				
					var destination = {
						index : 0,
						parentId : result.id
					};
					
					// Move the bookmark to that folder only if there is a successful result
					if (result !== undefined && result !== null) {
						me.moveBookmark(bookmark.id, destination, function(result){
							callback.call(me, result, deferred);
						});
					} else {
						callback.call(me, result, deferred);
					}
				});
			});
		},
		
		/**
		 * Sorts a bookmark if it is older than the configured age
		 * @param {BookmarkTreeNode} bookmark The bookmark to sort.
		 * @param {object} scope The scope to run the function in.
		 * @param {function} callback The bookmark to sort.
		 * @param {object} deferred The deferred object to resolve [JQuery whenSync].
		 */
		sortIfOld : function(bookmark, scope, callback, deferred) {
			var me = scope;
			console.log("oh my god sorting- ", bookmark);

			if (bookmark !== undefined) {
				var myId = bookmark.id;
				var url = bookmark.url;
				// It may be a folder
				if (url !== undefined) {
					var oldBookmarkDays = me.getOldBookmarkDays();

					// Get visits for the url
					me.chromeGetVisits(url, function(results){
						if(results !== undefined) {
							var visit = results[0];
							if (visit !== undefined)
							{
								var visitTime = visit.visitTime;
								var currentTime = new Date();
								var daysBetween = me.daysBetween(visitTime, currentTime.getTime());
							
								if (daysBetween > oldBookmarkDays) {
									// Sort the bookmark
									me.sortBookmark(bookmark, callback, deferred);
								} else {
									// Move the bookmark to the top of other bookmarks
									// Move it to the top of other bookmarks
									me.getOtherBookmarks(function(result) {

										var otherBookmarksId = result.id;
															
										var destination = {
											parentId : otherBookmarksId,
											index : 0
										};
									
										me.moveBookmark(myId, destination, function() {
											callback.call(me, undefined, deferred);
										});
									});
								}
							} else {
								// No history on this item... sort it anyways.
								me.sortBookmark(bookmark, callback, deferred);
							}
						} 
						
					});	
				}
			} 
		},

		/**
		 * Creates a folder by the category of the given URL
		 * Makes an Alchemy API request to check the category if it is not already cached
		 * @param {string} url The url to lookup.
		 * @param {string} parentId The parentId to create the folder in.
		 * @param {function} callback The callback to run after creating the folder.
		 */
		createFolderByCategory : function (url, parentId, callback) 
		{
			var me = this;
			
			me.alchemyCategoryLookup(url, function(category) {
				me.createFolder(category, parentId, callback);
			});
		},

		/**
		 * Creates a folder by the title of the given URL
		 * Makes an Alchemy API request to check the title if it is not already cached
		 * @param {string} url The url to lookup.
		 * @param {string} parentId The parentId to create the folder in.
		 * @param {function} callback The callback to run after creating the folder.
		 */
		createFolderByTitle : function (url, parentId, callback) {
			var me = this;
			me.alchemyTitleLookup(url, function(title) {
				me.createFolder(title, parentId, callback);
			});
		},

		/**
		 * Makes an Alchemy API request to check the category if it is not already cached
		 * @param {string} url The url to lookup.
		 * @param {function} callback The callback to run after the REST request completes.
		 */
		alchemyCategoryLookup : function (url, callback) 
		{
			var me = this,
				cachedData = me.jQueryStorageGetValue(url);
				baseUrl = me.getBaseUrl(url);
				
			// Check if there is cached data
			if(cachedData === null || cachedData.category === undefined) {
				// If not, make an API request.
				me.alchemyCategory(url, function(data, textStatus, jqXHR) {
					
					var category = data.category;
					var title = undefined;
					var status = data.status;
					var statusInfo = data.statusInfo;
		
					// Check the status first
					if (status === me.config.okStatus) {
						// If the score of the result is horrible, redo the whole thing using the baseUrl (if not already using it)
						var score = data.score;

						if (score < me.config.categoryErrorScore && baseUrl !== undefined ) {
							// Redo the categorization with the base URL because the result was not good enough
							me.alchemyCategoryLookup(baseUrl, callback);
							
						} else {			
							// Title data may already exist
							if(cachedData != null)
								title = cachedData.title;
				
							// Check result
							if (category !== null && category !== undefined) {
						
								// Cache the result in local storage
								me.jQueryStorageSetValue(url, {title: title, category: category});
								console.log("Good");
								// Invoke the callback
								callback.call(me, category);
							}
						}
					} else {
						// Error handling
						console.log("ERROR CAT = ", data);
						if(statusInfo == me.config.dailyLimitError) {
							// Daily limit reached must stop the chain
							me.chromeSendMessage(me.config.dailyLimitError);
						} else if (baseUrl !== undefined) {
							// Otherwise the page isn't HTML- fall back on the base URL.
							me.alchemyCategoryLookup(baseUrl, callback);						
						} else {
							// Cannot read this page- resolve with Unsorted
							callback.call(me, me.config.unsortedFolderName);
						}
					}
				});
			} else {
				// Cached category
				var category = cachedData.category;

				// Invoke the callback
				callback.call(me, category);
			}
		},

		/**
		 * Makes an Alchemy API request to check the title if it is not already cached
		 * @param {string} url The url to lookup.
		 * @param {function} callback The callback to run after the REST request completes.
		 */
		alchemyTitleLookup : function (url, callback) {
				// Check local cache to see if the base URL has associated data.
				var me = this,
					cachedData = me.jQueryStorageGetValue(baseUrl),
					baseUrl = me.getBaseUrl(url);

				// If not, make an API request.
				if(cachedData === null || cachedData.title === undefined)
				{
					me.alchemyTitle(baseUrl, function(data, textStatus, jqXHR) {

						var title = data.title;
						var category = undefined;
						var status = data.status;
			
						// Check the status first
						if (status === me.config.okStatus) {						
						
							// Category data may already exist
							if(cachedData != null)
								category = cachedData.category;
							
							// Check result
							if (title !== null && title !== undefined) {		
								// Cache the result in local storage
								me.jQueryStorageSetValue(baseUrl, {title: title, category: category});
							}
							
							// Invoke the callback
							callback.call(me, title);
						} else {
							// Error handling
							console.log("ERROR CAT = ", data);
							if(status == me.config.dailyLimitError) {
								// Daily limit reached must stop the chain
								me.chromeSendMessage(me.config.dailyLimitError);
							} else if (baseUrl !== undefined) {
								// Otherwise the page isn't HTML- fall back on the base URL.
								me.alchemyTitleLookup(baseUrl, callback);						
							} else {
								// Cannot read this page- resolve with Unsorted
								callback.call(me, me.config.unsortedFolderName);
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
		 * Create folder (if it does not exist) with specified parentID with name, callback
		 * @param {string} title The title of the folder.
		 * @param {string} parentId The parentId to create the folder in.
		 * @param {function} callback The callback to run after the folder is created.
		 */
		createFolder : function (title, parentId, callback) {
				var me = this;
				
				me.searchFolders(parentId, function(bookmark) {return bookmark !== undefined && bookmark.title === title && bookmark.url === undefined}, 
				function(ret) {
					if(ret.length > 0){
						// Folder already exists - invoke the callback with the first result
						callback.call(me, ret[0]);
					}
					else {
						// Create the folder and move to it	
						var folder = {
							title : title,
							parentId : parentId
						};
			
						// Disable the bookmark onCreate listener, because programmatic creation of bookmarks/folders will kick off the event
						me.detachCreateSort();
						// Create the folder
						me.createBookmark(folder, function(result) {
							// Invoke the callback
							callback.call(me, result);
						});
					}
				});
		},

		/**
		 * Sort a sample of bookmarks in Other Bookmarks
		 * @config {int} [sampleNumber] The number of bookmarks to sort in this sample
		 */
		sortSample : function ()
		{
			this.sortToplevelBookmarks(this.config.sampleNumber);
		},

		/**
		 * Sort all bookmarks in Other Bookmarks
		 */		
		sortAllBookmarks : function()
		{
			this.sortSubBookmarks(20);
		},

		/**
		 * Manually sort only top-level bookmarks in the Other Bookmarks folder
		 * @param {int} num The number of bookmarks to sort. If left undefined, sorts all bookmarks.
		 */
		sortToplevelBookmarks : function (num)
		{
			var me = this;
			// Get the other bookmarks children
			me.getOtherBookmarks(function(result) {
				me.getBookmarkChildren(result.id, function(results) {
					var bookmarks = me.filterBookmarks(results);
		
					// Sort the bookmarks tree
					me.sortBookmarks(bookmarks, num, function(){});	
				});
			});
		},
		
		/**
		 * Sorts all Other Bookmarks, including ones nested in folders.
		 * @param {number} num Number of bookmarks to sort. If left undefined, sort all bookmarks.
		 */
		sortSubBookmarks : function (num)
		{
			var me = this;
			// Get the ID of other bookmarks folder
			me.getOtherBookmarks(function(result) {
				// Get the flattened subtree of bookmark nodes
				me.getFlatSubTree(result.id, function(results) {
					// Filter out folders
					var bookmarks = me.filterBookmarks(results);
					// Sort the bookmarks tree
					me.sortBookmarks(bookmarks, num, function() {
						me.removeEmptyFolders();
					});	
				});
			});
		},
		
		/**
		 * Filters out folders from an array of bookmarks and folders.
		 * @param {array} bookmarksAndFolders An array of bookmarks and folders to filter
		 */
		filterBookmarks : function (bookmarksAndFolders) {
			var bookmarks = [],
				i;
	
			for(i = 0; i < bookmarksAndFolders.length; i++) {
				if (bookmarksAndFolders[i].url !== undefined) {
					bookmarks.push(bookmarksAndFolders[i]);
				}
			}
			
			return bookmarks;
		},
		
		/**
		 * Manually sorts the given BookmarkTreeNodes. If left undefined, sorts all bookmarks
		 * This code makes use of JQuery whenSync to chain an arbitrary number of asynchronous callbacks in sequence
		 * Performance is a concern, because whenSync gives all previous results to each callback in the chain- we don't need that.
		 * @param {string} rootId The rootId of the folder to sort.
		 * @param {int} num The number of bookmarks to sort. If left undefined, sorts all bookmarks.
		 */
		sortBookmarks : function (result, num, callback)
		{
			var me = this;

			// Make an array of sort functors
			var sortFuncts = [],
				length = (num !== undefined && num < result.length) ? num : result.length;

			// Push the starting asynchronous call
			sortFuncts.push(
				function () {
					var deferred = arguments[0];
					var index = result.length - 1;
					var bookmark = result[index];
	
					me.sortIfOld(bookmark, me, function(result, deferred) {
						deferred.resolve(index);
					}, deferred)	
				}
			);
			
			// Generate the other asynchronous calls in the chain
			for(i = 0; i < length - 1; i++) {					
				// Push a function to sort a bookmark at the chained index
				sortFuncts.push(
					function () {
						var deferred = arguments[0];
						var index = arguments[arguments.length - 1] - 1;
						var bookmark = result[index];

						me.sortIfOld(bookmark, me, function(result, deferred) {
							deferred.resolve(index);
						}, deferred);			
					}				
				);
			}

			// Chained asynchronous callbacks		
			var asyncChain = me.jQueryWhenSync(me, sortFuncts);
			
			// Bind to the asynchronous chain.
			asyncChain.done(
				function(){
					callback.call(me);
				}
			);
		},
		
		/**
		 * Gets an array of all bookmarks (children of folders included) with a given parentId
		 * @param {string} id The parentId to get the full subtree of
		 * @param {number} num The number of children to grab. If left undefined, grabs everything.
		 * @param {function} callback The callback to run with the results
		 */
		getFlatSubTree : function(id, callback) {
			var me = this;
			me.chromeGetSubTree(id, function(results) {
				var result = [];
				var enqueue = [];
				
				enqueue.push(results[0]);
				
				while (enqueue.length > 0) {
					var element = enqueue.pop();
					var elementChildren = element.children;
					if (element.children === undefined) {
						result.push(element);
					} else {
						for (var i = 0; i < elementChildren.length; i++) {
							enqueue.push(elementChildren[i]);
						}	
					}
				}
				callback.call(me, result);
			});
		},
		/**
		 * Removes all empty folders in Other Bookmarks
		 */
		 removeEmptyFolders : function()
		 {
			var me = this;
			me.getOtherBookmarks(function(result) {
				me.searchFolders(result.id, function(bookmark){return bookmark.url === undefined;}, function(ret) {
					// Loop through
					me.forEach(ret, function(bookmark) {
						// If I'm empty, remove me
						me.getBookmarkChildren(bookmark.id, function(results) {
							if (results.length == 0) {
								me.removeBookmark(bookmark.id, function(){});
							}
						});
					});
				});

			});
		 },
		
		/**
		 * Sets the api key in local storage
		 * @param {string} apikey The apikey to set
		 * @config {string} [apiStorageKey] Local storage key for api key
		 */
		setApiKey : function (apikey) 
		{
			this.jQueryStorageSetValue(this.config.apiStorageKey, apikey);
		},

		/**
		 * Gets the api key in local storage
		 * @config {string} [apiStorageKey] Local storage key for api key
		 * @returns {string}
		 */
		getApiKey : function ()
		{
			return this.jQueryStorageGetValue(this.config.apiStorageKey);
		},

		/**
		 * Sets auto create on
		 * @param {bool} value The boolean to set
		 * @config {string} [autoSortCreateKey] Local storage key auto create on
		 */
		setAutoOnCreate : function (value)
		{
			this.jQueryStorageSetValue(this.config.autoSortCreateKey, value);
		},

		/**
		 * Gets the api key in local storage
		 * @config {string} [autoSortCreateKey] Local storage key for api key
		 * @returns {bool}
		 */
		getAutoOnCreate : function ()
		{
			return this.jQueryStorageGetValue(this.config.autoSortCreateKey);
		},

		/**
		 * Sets the auto interval  in local storage
		 * @config {string} [autoSortTimedKey] Local storage key for timed sort
		 * @param {bool} value The boolean to set
		 */
		setAutoInterval : function (value)
		{
			this.jQueryStorageSetValue(this.config.autoSortTimedKey, value);
		},

		/**
		 * Get the auto interval in local storage
		 * @config {string} [autoSortTimedKey] Local storage key for timed sort
		 * @returns {bool}
		 */
		getAutoInterval : function ()
		{
			return this.jQueryStorageGetValue(this.config.autoSortTimedKey);
		},

		/**
		 * Sets the auto prioritize  in local storage
		 * @config {string} [autoSortPriorityKey] Local storage key for priority sort
		 * @param {bool} value The boolean to set
		 */
		setAutoPrioritize : function (value)
		{
			this.jQueryStorageSetValue(this.config.autoSortPriorityKey, value);
		},

		/**
		 * Get the auto interval in local storage
		 * @config {string} [autoSortPriorityKey] Local storage key for priority sort
		 * @returns {bool}
		 */
		getAutoPrioritize : function ()
		{
			return this.jQueryStorageGetValue(this.config.autoSortPriorityKey);
		},

		/**
		 * Set the old bookmark days in local storage
		 * @config {string} [oldBookmarkDaysKey] Local storage key for old bookmark days
		 * @param {int} value The int to set
		 */
		setOldBookmarkDays : function (value)
		{
			this.jQueryStorageSetValue(this.config.oldBookmarkDaysKey, value);
		},

		/**
		 * Get the old bookmark days in local storage
		 * @config {string} [autoSortPriorityKey] Local storage key for old bookmark days
		 * @config {string} [oldBookmarkDaysDefault] Default old bookmark days
		 * @returns {int}
		 */
		getOldBookmarkDays : function ()
		{
			return this.jQueryStorageGetValue(this.config.oldBookmarkDaysKey) || this.config.oldBookmarkDaysDefault;
		},

		/**
		 * Get the base url of a qualified URL
		 * @param {string} url The qualified url to slice
		 * @returns {string}
		 */
		getBaseUrl : function (url)
		{
			pathArray = String(url).split( '/' ); 
			host = pathArray[2];
			if (host === undefined) {
				return host;
			}
			else {
				return "http://" + host;
			}
		},

		/**
		 * Get the UTC date 
		 * Courtesy of Michael Liu at http://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-jquery
		 * @param {date} date The date to treat as UTC
		 * @returns {int}
		 */
		treatAsUTC : function (date) {
			var result = new Date(date);
			result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
			return result;
		},

		/**
		 * Get the days between two UTC dates
		 * Courtesy of Michael Liu at http://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-jquery
		 * @param {date} date The start date to treat as UTC, the end date to treat as UTC
		 * @returns {int}
		 */
		daysBetween : function (startDate, endDate) {
			var millisecondsPerDay = 24 * 60 * 60 * 1000;
			return (this.treatAsUTC(endDate) - this.treatAsUTC(startDate)) / millisecondsPerDay;
		},

		/******* JQUERY *******/

		/**
		 * Make a REST request with JQuery. Wraps around JQuery
		 * @param {string} requestURL The endpoint request URL
		 * @param {object} data The data to send
		 * @param {function} callback The callback to run after request completes
		 * @param {string} dataType The data type to return back
		 */
		jqueryREST : function (requestURL, data, callback, dataType)
		{
			jQuery.get(requestURL, data, callback, dataType);
		},

		/**
		 * Get value from local storage using JQuery plugin totalStorage.
		 * @param {string} key The key to look in
		 * @returns {?} The value at the given key
		 */
		jQueryStorageGetValue : function (key)
		{
			return $.totalStorage(key);
		},

		/**
		 * Set value in local storage using JQuery plugin totalStorage.
		 * @param {string} key The key to set at
		 * @param {string} value The value to set
		 */
		jQueryStorageSetValue : function (key, value)
		{
			$.totalStorage(key, value);
		},
	
		/**
		 * Executes arbitrary number of asynchronous callbacks in sequence
		 * @param {object} scope The scope to execute the functions in
		 * @param {array} functions Array of functions to execute
		 */	
		jQueryWhenSync : function(scope, functions)
		{
			return $.whenSync.apply(scope, functions);	
		},

		/******* ALCHEMY API *******/

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
		alchemyKeyTest : function (apiKey, callbackA, callbackB, argsA, argsB, scope)
		{
			//Create a local data object for the API request 
			var url = "http://www.google.com",
				me = this;
				
			var data = { 
				url : url,
				apikey : apiKey,
				outputMode : this.config.outputMode
			};
			
			var dataType = "json";
			var requestURL = this.config.requestCategoryURL;
			
			var apiCallback = function(data, textStatus, jqXHR) {
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
		alchemyCategory : function (url, callback)
		{
			// Get the api key from local storage
			var me = this,
				apikey = me.getApiKey();
				
			// Create a local data object for the API request 
			var data = { 
				url : url,
				apikey : apikey,
				outputMode : me.config.outputMode
			};
			
			var dataType = "json";
			var requestURL = me.config.requestCategoryURL;
			
			// API request for getting the category of a URL
			me.jqueryREST(requestURL, data, callback, dataType);
		},

		/**
		 * Make an Alchemy API title request that runs the callback when complete
		 * @param {string} url The url to extract title 
		 * @param {function} callback The function to run with the result
		 * @config {string} [outputMode] Output mode for the request (like json)
		 * @config {string} [requestTitleURL] Endpoint for Alchemy category requests
		 */
		alchemyTitle : function (url, callback)
		{
			// Get the api key from local storage
			var me = this,
				apikey = me.getApiKey();

			//Create a local data object for the API request 
			var data = { 
				url : url,
				apikey : apikey,
				outputMode : me.config.outputMode
			};
			
			var dataType = "json";
			var requestURL = me.config.requestTitleURL;
			
			//API request for getting the category of a URL
			me.jqueryREST(requestURL, data, callback, dataType);
		},

		/******* FUNCTIONAL *******/

		/**
		 * Need to refactor this
		 * Foreach with given callback and a way to break out
		 * @param {array} array The array to foreach 
		 * @param {function} action The function to run on each element
		 * @config {function} [Break] Break function
		 */
		forEach : function (array, action) {
		var Break = {toString: function() {return "Break";}};

		try {
			for (var i = 0; i < array.length; i++)
			  action(array[i]);
			}
		catch (exception) {
			if (exception != Break)
			  throw exception;
			}
		},
		
		/******* CHROME CONTROL *******/

		/**
		 * Recurses through the bookmark tree looking for bookmarks that pass the test
		 * Needed because chrome.bookmarks.search() does not include folders in the result.
		 * This code is very broken!
		 * @param {string} parentId The optional parentId to search for 
		 * @param {function} test The function to test on a BookmarkTreeNode element 
		 * @param {function} callback The callback to run with the results
		 */
		searchFolders : function (parentId, test, callback)
		{
			var me = this;
			var ret = [];
			function testBookmarks(bookmarks) {
			  me.forEach(bookmarks, function(bookmark) {

				if(test.call(me, bookmark)){
					ret.push(bookmark);
				}

			  });

			  return ret;
			}
			
			me.getOtherBookmarks(function(result) {
				var searchParentId = parentId || result.id;
				
				me.getBookmarkChildren(searchParentId, function(bookmarks) {
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
		getOtherBookmarks : function (callback) {
			// Get the ID of other bookmarks folder
			var me = this;
			me.getBookmarkChildren(me.config.rootBookmarksIndex.toString(), function(results) {
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
		searchBookmarks : function (query, callback)
		{
			return chrome.bookmarks.search(query, callback)
		},

		/**
		 * Get all children bookmarks at id
		 * @param {string} id The id of parent
		 * @param {function} callback The callback to run with the child bookmarks
		 */
		getBookmarkChildren : function (id, callback)
		{
			chrome.bookmarks.getChildren(id, callback);
		},

		/**
		 * Removes a bookmark with the given ID.
		 * @param {string} id The id of the bookmark to remove
		 * @param {function} callback The callback to run after removing
		 */
		removeBookmark : function (id, callback) {
			chrome.bookmarks.remove(id, callback);
		},

		/**
		 * Removes all folders with the given name. Particularly useful in testing and damage control.
		 * @param {string} name The name of the folder(s) to remove
		 * @ignore
		 */
		removeBookmarks : function (name)
		{
			var me = this;
			me.searchFolders(function(bookmark){return bookmark != undefined && bookmark.title == name; }, function(ret) {
				me.forEach(ret, function(bookmark){
					chrome.bookmarks.remove(bookmark.id, function() {});
				});
			});
		},

		/**
		 * Get all children bookmarks at id
		 * @param {string} id The id of parent
		 * @param {object} destination The destination to move to (chrome api specified)
		 * @param {function} callback The callback to run after moving the bookmark
		 */
		moveBookmark : function (id, destination, callback) 
		{
			chrome.bookmarks.move(id, destination, callback);
		},

		/**
		 * Create a bookmark or folder
		 * @param {object} bookmark The bookmark to create
		 * @param {function} callback The callback to run after creating the bookmark
		 */
		createBookmark : function (bookmark, callback)
		{
			chrome.bookmarks.create(bookmark, callback);
		},

		/**
		 * Attach bookmark create event
		 * @param {function} callback The listener to attach
		 */
		chromeBookmarkOnCreated : function (callback)
		{
			chrome.bookmarks.onCreated.addListener(callback);
		},

		/**
		 * Detach bookmark create event
		 * @param {function} callback The listener to detach
		 */
		chromeBookmarksDetachCreated : function (callback)
		{
			chrome.bookmarks.onCreated.removeListener(callback);
		},

		/**
		 * Attach on visited event
		 * @param {function} callback The listener to attach
		 */
		chromeHistoryOnVisited : function (callback)
		{
			chrome.history.onVisited.addListener(callback);
		},

		/**
		 * Detach on visited event
		 * @param {function} callback The listener to detach
		 */
		chromeHistoryDetachVisited : function (callback)
		{
			chrome.history.onVisited.removeListener(callback);
		},

		/**
		 * Attach on an alarm
		 * @param {string} name The name of the alarm
		 * @param {function} callback The listener to attach
		 * @param {double} interval The interval to attach in minutes
		 */
		chromeDeployAlarm : function (name, callback, interval)
		{
			chrome.alarms.create(name, {periodInMinutes : interval});
			chrome.alarms.onAlarm.addListener(callback);
		},

		/**
		 * Detach an alarm by name
		 * @param {string} name The name of the alarm listener to detach
		 */
		chromeAlarmsDetach : function (name)
		{
			chrome.alarms.clear(name);
		},

		/**
		 * Get visit information by URL
		 * @param {string} url The url to search history for
		 * @param {function} callback The callback to run with visit results
		 */
		chromeGetVisits : function (url, callback)
		{
			chrome.history.getVisits({url: url}, callback);
		},
		
		/**
		 * Get subtree by id
		 * @param {string} id The id to grab a subtree
		 * @param {function} callback The callback to run with visit results
		 */
		chromeGetSubTree : function (id, callback)
		{
			chrome.bookmarks.getSubTree(id, callback);	
		},
		
		/**
		 * Send a message to the rest of the extension
		 * @param {string} message The message to send
		 */		
		chromeSendMessage : function (message) 
		{
			chrome.extension.sendMessage(undefined, message);		
		}
	};
})(this);
