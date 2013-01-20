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

/** SmartBookmarkSorter configuration properties. These are all constants. */
SmartBookmarkSorter = {
	config : {
		requestCategoryURL : 		"http://access.alchemyapi.com/calls/url/URLGetCategory",
		requestTitleURL : 			"http://access.alchemyapi.com/calls/url/URLGetTitle",
		requestTopicURL : 			"http://access.alchemyapi.com/calls/url/URLGetRankedConcepts",
		apiStorageKey : 			"bookmarksort_apikey",
		oldBookmarkDaysKey : 		"bookmarksort_oldarchive",
		autoSortActiveKey : 		"bookmarksort_auto_on",
		outputMode : 				"json",
		autoSortMinutes : 			1,
		indexCounter : 				"bookmarkIndexCounter",
		oldBookmarkDaysDefault : 	30,
		bookmarkAlarm : 			"bookmarkAlarm",
		rootBookmarksKey : 			0,
		otherBookmarksKey : 		1,
		sampleNumber : 				3,
		autoSortCreateKey : 		"bookmarkauto_oncreate",
		autoSortTimedKey : 			"bookmarkauto_timed",
		autoSortPriorityKey : 		"bookmarkauto_priority"
	},
}

/******* BOOKMARK SORTER *******/

/**
 * Enable the automatic create sort.
 * Sorts bookmarks as they are created
 */
function attachCreateSort() {
	/* When a bookmark is created, it will be moved to an appropriate Title folder." */
	chromeBookmarkOnCreated(onCreatedListener);
}

/**
 * Enable the automatic timed sort.
 * Sorts older bookmarks on a timed interval.
 */
function attachIntervalSort() {
	/* On a timed interval, older bookmarks will be archived to a Category folder and loose bookmarks will be sorted. */
	chromeDeployAlarm(SmartBookmarkSorter.config.bookmarkAlarm, intervalAlarm, SmartBookmarkSorter.config.autoSortMinutes); 
}

/**
 * Enable the automatic visit sort.
 * Will send bookmarks to the top as they are accessed.
 */
function attachVisitSort() {
	/*When visiting a URL, a matching bookmark will be moved up. <TODO?> If it's in an archive, it will be taken out. */
	chromeHistoryOnVisited(onVisitedListener);
}

/**
 * Detaches the automatic create sort
 */
function detachCreateSort() {
	chromeBookmarksDetachCreated(onCreatedListener);
}

/**
 * Detaches the automatic interval sort
*/
function detachIntervalSort() {
	chromeAlarmsDetach(SmartBookmarkSorter.config.bookmarkAlarm);
}

/**
 * Detaches the automatic visit sort
*/
function detachVisitSort() {
	chromeHistoryDetachVisited(onVisitedListener);
}

/**
 * Enables automatic sort
 * Checks local storage configuration values to determine which sorts to enable
*/
function enableAutomaticSort() {
	var isOnCreate = getAutoOnCreate();
	var isOnInterval = getAutoInterval();
	var isPrioritize = getAutoPrioritize();

	if(isOnCreate)
		attachCreateSort();
	if(isOnInterval)
		attachIntervalSort();
	if(isPrioritize)
		attachVisitSort();
}

/**
 * Disables automatic sort
 * Drops all of the attached sorts
*/
function disableAutomaticSort() {
	detachCreateSort();
	detachIntervalSort();
	detachVisitSort();
}

/**
 * Listener for the onCreated automatic sort
 * @param {id} id The id of the bookmark that was just created.
 * @param {bookmark} bookmark The bookmark that was just created.
 */
function onCreatedListener(id, bookmark)
{
	// Sort the bookmark by title
	sortBookmark(bookmark);
}

/**
 * Listener for the onVisited automatic sort
 * Searches through bookmarks for a URL match
 * @param {HistoryItem} result The HistoryItem of the URL that was visited.
 */
function onVisitedListener(result)
{
	var url = result.url;
	// Get the base url

	// Check if a matching bookmark exists
	searchBookmarks(url, function(results) {
		var result = results[0];

		// Matching bookmark to url exists
		if(result !==  undefined)
		{
			var id = result.id;	
			var parentId = result.parentId;

			// Move it to the top of other bookmarks
			getOtherBookmarks(function(result) {

				var otherBookmarksId = result.id;
									
				var destination = {
					parentId : otherBookmarksId,
					index : 0
				};
				
				moveBookmark(id, destination, function() {});
			});
		}
		// Otherwise, do nothing.
	});
}

/**
 * Listener for the onInterval automatic sort
 * Iterates through bookmarks on a timed interval, sorting older ones
 * @param {Alarm} alarm The alarm to attach.
 * @config {int} [oldBookmarkDays] Sort bookmarks that are older than this in days
 * @config {int} [rootBookmarksKey] Index of root bookmarks
 * @config {int} [otherBookmarksKey] Index of other bookmarks
 */
function intervalAlarm(alarm)
{
	// Get the local counter or start it at 0
	var me = this;
	var counterKey = SmartBookmarkSorter.config.indexCounter;
	var counterValue = jQueryStorageGetValue(counterKey) || 0;
		
	// Get the ID of other bookmarks folder
	getBookmarkChildren(SmartBookmarkSorter.config.rootBookmarksKey.toString(), function(results) {
		var otherBookmarksId = results[SmartBookmarkSorter.config.otherBookmarksKey].id;

		// Get the children of other Bookmarks
		getBookmarkChildren(otherBookmarksId, function(results) {
			// Get the bookmark at the current index
			var bookmark = results[counterValue];
			
			if(bookmark !== undefined) {				
				// Check if the URL hasn't been visited in a while
				var title = bookmark.title;
				var url = bookmark.url;
				var myId = bookmark.id;
				var baseUrl = getBaseUrl(url);

				// Could be a folder
				if(url !== undefined)
				{
					// Get visits for the url
					chromeGetVisits(url, function(results) {
						var oldBookmarkDays = getOldBookmarkDays();
						if(results !== undefined) {
							var visit = results[0];
							if (visit !== undefined)
							{
								var visitTime = visit.visitTime;
								var currentTime = new Date();
								var daysBetween = me.daysBetween(visitTime, currentTime.getTime());
							
								if (daysBetween > oldBookmarkDays) {
									// Sort the bookmark by category
									sortBookmark(bookmark);		
								} 
							} else {
								// No history on this item... sort it anyway.
								sortBookmark(bookmark);		
							}
						} 
					});
				}
			}	
			// Otherwise, do nothing.
		
			// Set the counter to the next index, or 0 if it is the tail
			var incCounter = counterValue < results.length ? counterValue + 1 : 0;

			jQueryStorageSetValue(counterKey, incCounter);
		});
	});
}

/**
 * Sorts a single bookmark
 * Makes two folders and puts the bookmark in the 2nd folder
 * @param {BookmarkTreeNode} bookmark The bookmark to sort.
 */
function sortBookmark(bookmark) {
	createFolderByCategory(bookmark.url, undefined, function(result) {
		createFolderByTitle(bookmark.url, result.id, function(result) {
			var destination = {
				index : 0,
				parentId : result.id
			};
			
			// Move the bookmark to that folder
			moveBookmark(bookmark.id, destination, function(result){});
		});
	});
}

/**
 * Creates a folder by the category of the given URL
 * Makes an Alchemy API request to check the category if it is not already cached
 * @param {string} url The url to lookup.
 * @param {string} parentId The parentId to create the folder in.
 * @param {function} callback The callback to run after creating the folder.
 */
function createFolderByCategory(url, parentId, callback) 
{
	alchemyCategoryLookup(url, function(category) {
		createFolder(category, parentId, callback);
	});
}

/**
 * Creates a folder by the title of the given URL
 * Makes an Alchemy API request to check the title if it is not already cached
 * @param {string} url The url to lookup.
 * @param {string} parentId The parentId to create the folder in.
 * @param {function} callback The callback to run after creating the folder.
 */
function createFolderByTitle(url, parentId, callback) {
	alchemyTitleLookup(url, function(title) {
		createFolder(title, parentId, callback);
	});
}

/**
 * Makes an Alchemy API request to check the category if it is not already cached
 * @param {string} url The url to lookup.
 * @param {function} callback The callback to run after the REST request completes.
 */
function alchemyCategoryLookup(url, callback) 
{
	var cachedData = jQueryStorageGetValue(url),
		me = this;
	
	// Check if there is cached data
	if(cachedData === null || cachedData.title === undefined) {
		// If not, make an API request.
		alchemyCategory(url, function(data, textStatus, jqXHR) {

			var category = data.category;
			var title = undefined;

			// Title data may already exist
			if(cachedData != null)
				title = cachedData.title;
						
			// Check result
			if (category !== null && category !== undefined) {
		
				// Cache the result in local storage
				jQueryStorageSetValue(url, {title: title, category: category});
								
				// Invoke the callback
				callback.call(me, category);
			}
		});
	} else {
		// Cached category
		var category = cachedData.category;
		
		// Invoke the callback
		callback.call(me, category);
	}
}

/**
 * Makes an Alchemy API request to check the title if it is not already cached
 * @param {string} url The url to lookup.
 * @param {function} callback The callback to run after the REST request completes.
 */
function alchemyTitleLookup(url, callback) {
		// Check local cache to see if the base URL has associated data.
		var cachedData = jQueryStorageGetValue(url),
			me = this;
		
		// Get the base url
		var baseUrl = getBaseUrl(url);
		
		// If not, make an API request.
		if(cachedData === null || cachedData.title === undefined)
		{
			this.alchemyTitle(baseUrl, function(data, textStatus, jqXHR) {

				var title = data.title;
				
				var category = undefined;
				// Category data may already exist
				if(cachedData != null)
					category = cachedData.category;
				
				// Check result
				if (title !== null && title !== undefined) {		
					// Cache the result in local storage
					me.jQueryStorageSetValue(url, {title: title, category: category});
				}
				
				// Invoke the callback
				callback.call(me, title);
			});
		}
		else 
		{
			// Cached title
			var title = cachedData.title;
			
			// Invoke the callback
			callback.call(me, title);

		}
}

/**
 * Create folder (if it does not exist) with specified parentID with name, callback
 * @param {string} title The title of the folder.
 * @param {string} parentId The parentId to create the folder in.
 * @param {function} callback The callback to run after the folder is created.
 */
function createFolder(title, parentId, callback) {
		var me = this;
		
		searchFolders(function(bookmark) {return bookmark !== undefined && bookmark.title == title && bookmark.url == undefined;}, function(ret) {
			if(ret.length > 0){
				// Folder already exists - invoke the callback with the first result
				callback.call(me, ret[0]);
			}
			else {
				// Create the folder and move to it	
				//console.log("New folder: ", title);
				var folder = {
					title : title,
					parentId : parentId
				};
	
				// Disable the bookmark onCreate listener, because programmatic creation of bookmarks/folders will kick off the event
				me.chromeBookmarksDetachCreated(onCreatedListener);
				// Create the folder
				me.createBookmark(folder, function(result) {
					// Enable the bookmark onCreate listener
					me.chromeBookmarkOnCreated(me.onCreatedListener);
					// Invoke the callback
					callback.call(me, result);
				});
			}
		});
}

/**
 * Sort a sample of bookmarks
 * @config {int} [sampleNumber] The number of bookmarks to sort in this sample
 */
function sortSample()
{
	sortOtherBookmarks(SmartBookmarkSorter.config.sampleNumber);
}

/**
 * Manually sort the other bookmarks folder
 * @param {int} num The number of bookmarks to sort. If left undefined, sorts all bookmarks.
 * @config {int} [rootBookmarksKey] The index of root bookmarks
 * @config {int} [otherBookmarksKey] The index of other bookmarks
 */
function sortOtherBookmarks(num)
{
	// Get the ID of other bookmarks folder
	getBookmarkChildren(SmartBookmarkSorter.config.rootBookmarksKey.toString(), function(results) {
		var id = results[SmartBookmarkSorter.config.otherBookmarksKey].id;
		sortBookmarks(id, num);	
	});
}

/**
 * Manually sorts specified amount of bookmarks. If left undefined, sorts all bookmarks
 * NOTE: this code is broken..it doesn't count how many bookmarks it has sorted when it recurses into folders.
 * @param {string} rootId The rootId of the folder to sort.
 * @param {int} num The number of bookmarks to sort. If left undefined, sorts all bookmarks.
 * @config {int} [oldBookmarkDays] Sort bookmarks that are older than this in days
 */
function sortBookmarks(rootId, num)
{
	var me = this;
	getBookmarkChildren(rootId, function(results) {
		
		var numSorts = num || results.length,
			i = 0;

		// Sort the bookmarks
		for (; i < numSorts; i++) {
			var bookmark = results[i];

			// Closure
			(function(bookmark) {
				if (bookmark !== undefined) {
					var myId = bookmark.id;
					var url = bookmark.url;
					
					// It may be a folder
					if (url !== undefined) {
						var oldBookmarkDays = getOldBookmarkDays();
						
						// Get visits for the url
						chromeGetVisits(url, function(results){
							if(results !== undefined) {
								var visit = results[0];
								if (visit !== undefined)
								{
									var visitTime = visit.visitTime;
									var currentTime = new Date();
									var daysBetween = me.daysBetween(visitTime, currentTime.getTime());
								
									if (daysBetween > oldBookmarkDays) {
										// Sort the bookmark
										sortBookmark(bookmark);
									} else {
										// Move the bookmark to the top
										//
									}
								} else {
									// No history on this item... sort it anyways.
									sortBookmark(bookmark);
								}
							} 
							
						});	
					} else {
						// Recurse into the folder
						sortBookmarks(myId, numSorts);
					}
				}
			})(bookmark)
		}	
	});
}

/**
 * Sets the api key in local storage
 * @param {string} apikey The apikey to set
 * @config {string} [bookmarksort_apikey] Local storage key for api key
 */
function setApiKey(apikey) 
{
	jQueryStorageSetValue(SmartBookmarkSorter.config.bookmarksort_apikey, apikey);
}

/**
 * Gets the api key in local storage
 * @config {string} [bookmarksort_apikey] Local storage key for api key
 * @returns {string}
 */
function getApiKey()
{
	return jQueryStorageGetValue(SmartBookmarkSorter.config.bookmarksort_apikey);
}

/**
 * Sets auto create on
 * @param {bool} value The boolean to set
 * @config {string} [autoSortCreateKey] Local storage key auto create on
 */
function setAutoOnCreate(value)
{
	jQueryStorageSetValue(SmartBookmarkSorter.config.autoSortCreateKey, value);
}

/**
 * Gets the api key in local storage
 * @config {string} [bookmarksort_apikey] Local storage key for api key
 * @returns {bool}
 */
function getAutoOnCreate()
{
	return jQueryStorageGetValue(SmartBookmarkSorter.config.autoSortCreateKey);
}

/**
 * Sets the auto interval  in local storage
 * @config {string} [autoTimedKey] Local storage key for timed sort
 * @param {bool} value The boolean to set
 */
function setAutoInterval(value)
{
	jQueryStorageSetValue(SmartBookmarkSorter.config.autoTimedKey, value);
}

/**
 * Get the auto interval in local storage
 * @config {string} [autoTimedKey] Local storage key for timed sort
 * @returns {bool}
 */
function getAutoInterval()
{
	return jQueryStorageGetValue(SmartBookmarkSorter.config.autoTimedKey);
}

/**
 * Sets the auto prioritize  in local storage
 * @config {string} [autoSortPriorityKey] Local storage key for priority sort
 * @param {bool} value The boolean to set
 */
function setAutoPrioritize(value)
{
	jQueryStorageSetValue(SmartBookmarkSorter.config.autoSortPriorityKey, value);
}

/**
 * Get the auto interval in local storage
 * @config {string} [autoSortPriorityKey] Local storage key for priority sort
 * @returns {bool}
 */
function getAutoPrioritize()
{
	return jQueryStorageGetValue(SmartBookmarkSorter.config.autoSortPriorityKey);
}

/**
 * Set the old bookmark days in local storage
 * @config {string} [oldBookmarkDaysKey] Local storage key for old bookmark days
 * @param {int} value The int to set
 */
function setOldBookmarkDays(value)
{
	jQueryStorageSetValue(SmartBookmarkSorter.config.oldBookmarkDaysKey, value);
}

/**
 * Get the old bookmark days in local storage
 * @config {string} [autoSortPriorityKey] Local storage key for old bookmark days
 * @returns {int}
 */
function getOldBookmarkDays()
{
	return jQueryStorageGetValue(SmartBookmarkSorter.config.oldBookmarkDaysKey) || SmartBookmarkSorter.config.oldBookmarkDaysDefault;
}

/**
 * Get the base url of a qualified URL
 * @param {string} url The qualified url to slice
 * @returns {string}
 */
function getBaseUrl(url)
{
	pathArray = String(url).split( '/' ); 
	host = pathArray[2]; 
	return host;
}

/**
 * Get the UTC date 
 * Courtesy of Michael Liu at http://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-jquery
 * @param {date} date The date to treat as UTC
 * @returns {int}
 */
function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

/**
 * Get the days between two UTC dates
 * Courtesy of Michael Liu at http://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-jquery
 * @param {date} date The start date to treat as UTC, the end date to treat as UTC
 * @returns {int}
 */
function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}

/******* JQUERY *******/

/**
 * Make a REST request with JQuery. Wraps around JQuery
 * @param {string} requestURL The endpoint request URL
 * @param {object} data The data to send
 * @param {function} callback The callback to run after request completes
 * @param {string} dataType The data type to return back
 */
function jqueryREST(requestURL, data, callback, dataType)
{
	jQuery.get(requestURL, data, callback, dataType);
}

/**
 * Get value from local storage using JQuery plugin totalStorage.
 * @param {string} key The key to look in
 * @returns {?} The value at the given key
 */
function jQueryStorageGetValue(key)
{
	return $.totalStorage(key);
}

/**
 * Set value in local storage using JQuery plugin totalStorage.
 * @param {string} key The key to set at
 * @param {string} value The value to set
 */
function jQueryStorageSetValue(key, value)
{
	$.totalStorage(key, value);
}

/******* ALCHEMY API *******/
/*
Make an Alchemy API key test that runs callbackA if the key is valid, and runs callbackB if the key is not valid. Assumes google.com is operational :)
*/
function alchemyKeyTest(apiKey, callbackA, callbackB, argsA, argsB, scope)
{
	//Create a local data object for the API request 
	var url = "http://www.google.com";
	var data = { 
		url : url,
		apikey : apiKey,
		outputMode : this.SmartBookmarkSorter.config.outputMode
	};
	
	var dataType = "json";
	var requestURL = this.SmartBookmarkSorter.config.requestCategoryURL;
	var apiCallback = function(data, textStatus, jqXHR) {
		data.statusInfo === "invalid-api-key" ? callbackB.apply(argsB, scope) : callbackA.apply(argsA, scope);
	};
	//API request for getting the category of a URL
	this.jqueryREST(requestURL, data, apiCallback, dataType);
}

/*
Make an Alchemy API Text Extraction REST request
*/
function alchemyCategory(url, callback)
{
	// Get the api key from local storage
	var apikey = getApiKey();
	
	// Create a local data object for the API request 
	var data = { 
		url : url,
		apikey : apikey,
		outputMode : this.SmartBookmarkSorter.config.outputMode
	};
	
	var dataType = "json";
	var requestURL = this.SmartBookmarkSorter.config.requestCategoryURL;
	
	// API request for getting the category of a URL
	this.jqueryREST(requestURL, data, callback, dataType);
}

/*
Make an Alchemy API Title REST request
*/
function alchemyTitle(url, callback)
{
	// Get the api key from local storage
	var apikey = getApiKey();

	//Create a local data object for the API request 
	var data = { 
		url : url,
		apikey : apikey,
		outputMode : this.SmartBookmarkSorter.config.outputMode
	};
	
	var dataType = "json";
	var requestURL = this.SmartBookmarkSorter.config.requestTitleURL;
	
	//API request for getting the category of a URL
	this.jqueryREST(requestURL, data, callback, dataType);
	
}


/******* FUNCTIONAL *******/
var Break = {toString: function() {return "Break";}};

function forEach(array, action) {
  try {
    for (var i = 0; i < array.length; i++)
      action(array[i]);
  }
  catch (exception) {
    if (exception != Break)
      throw exception;
  }
}

/******* CHROME CONTROL *******/
/*
Recurses through the bookmark tree looking for bookmarks that pass the test.

Needed because chrome.bookmarks.search() does not include folders in the result.
*/
function searchFolders(test, callback)
{
	var me = this;
	var ret = [];
	function testBookmarks(bookmarks) {
	  me.forEach(bookmarks, function(bookmark) {

		if (bookmark.children){
			testBookmarks(bookmark.children);
		}
	
		if(test.call(me, bookmark)){
			ret.push(bookmark);
		}

	  });

	  return ret;
	}
	
	chrome.bookmarks.getTree(function(bookmarks) {
		var ret = testBookmarks(bookmarks);
		callback.call(me, ret);
	});
}

/*
Get other bookmarks folder
*/
function getOtherBookmarks(callback) {
	// Get the ID of other bookmarks folder
	var me = this;
	getBookmarkChildren(SmartBookmarkSorter.config.rootBookmarksKey.toString(), function(results) {
		var otherBookmarks = results[SmartBookmarkSorter.config.otherBookmarksKey];
		callback.call(me, otherBookmarks);
	});
}

/*
Search bookmarks with query

Does not return folders
*/
function searchBookmarks(query, callback)
{
	return chrome.bookmarks.search(query, callback)
}

/*
Get a bookmark
*/
function getBookmark(id, callback)
{
	return chrome.bookmarks.get(id, callback);
}

/*
Get all bookmarks at id
*/
function getBookmarkChildren(id, callback)
{
	chrome.bookmarks.getChildren(id, callback);
}

/*
Removes all folders with the given name
Particularly useful in testing and damage control.
*/
function removeBookmarks(name)
{
	searchFolders(function(bookmark){return bookmark != undefined && bookmark.title == name; }, function(ret) {
		forEach(ret, function(bookmark){
			chrome.bookmarks.remove(bookmark.id, function() {});
		});
	});
}

/*
Moves a bookmark
*/
function moveBookmark(id, destination, callback) 
{
	chrome.bookmarks.move(id, destination, callback);
}

/*
Create a folder
*/
function createBookmark(bookmark, callback)
{
	chrome.bookmarks.create(bookmark, callback);
}

/*
Attach bookmark create event
*/
function chromeBookmarkOnCreated(callback)
{
	chrome.bookmarks.onCreated.addListener(callback);
}

/*
Detach bookmark create visted event
*/
function chromeBookmarksDetachCreated(callback)
{
	chrome.bookmarks.onCreated.removeListener(callback);
}

/*
Attach history on visted event
*/
function chromeHistoryOnVisited(callback)
{
	chrome.history.onVisited.addListener(callback);
}

/*
Detach history on visted event
*/
function chromeHistoryDetachVisited(callback)
{
	chrome.history.onVisited.removeListener(callback);
}

/* 
Detach alarm
*/
function chromeAlarmsDetach(name)
{
	chrome.alarms.clear(name);
}
/*
Get visits about a url
*/
function chromeGetVisits(url, callback)
{
	chrome.history.getVisits({url: url}, callback);
}

/*
Create alarm function
*/
function chromeDeployAlarm(name, callback, interval)
{
    chrome.alarms.create(name, {periodInMinutes : interval});
	chrome.alarms.onAlarm.addListener(callback);
}
