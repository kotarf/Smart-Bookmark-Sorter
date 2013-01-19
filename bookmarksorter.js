// Smartsort.is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Smartsort.is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Smartsort. If not, see <http://www.gnu.org/licenses/>.

/*

Can I change the callback's arguments, and store variables in the arguments...

ToDo: 
BUG: 
1- autosort and extension must persist in the background. ***Keep Bookmarks library, make NEW FILE for background page that runs a script depending on the given params.***
2- extension must start up when the browser is opened (controllable with flag?)
3- autosort flags must be in local storage
4- manual sort AND auto sort should delete empty folders
5- put all keys into a single object...

***Bookmark Create can fail if the quota is reached
callback.call(***THIS***, args) http://www.datejs.com/
Returning inside a callback will pass it up and return out of the original function
onCreate should move the folder up.
Duplicates should be found and combined.
Empty folders should be deleted
Accessing variables outside of a callback (asynchronous function) is bad...use a closure
Alchemy requests may fail on URLs that are firewalled (proprietary) - do we fall back on the website title given by chrome?
*/


SmartBookmarks = {
	config : {
		requestCategoryURL : "http://access.alchemyapi.com/calls/url/URLGetCategory",
		requestTitleURL : "http://access.alchemyapi.com/calls/url/URLGetTitle",
		requestTopicURL : "http://access.alchemyapi.com/calls/url/URLGetRankedConcepts",
		apiStorageKey : "bookmarksort_apikey",
		oldBookmarkDaysKey : "bookmarksort_oldarchive",
		autoSortActiveKey : "bookmarksort_auto_on",
		outputMode : "json",
		autoSortMinutes : 1,
		indexCounter : "bookmarkIndexCounter",
		oldBookmarkDaysDefault : 30,
		bookmarkAlarm : "bookmarkAlarm",
		rootBookmarksKey : 0,
		otherBookmarksKey : 1,
		sampleNumber : 3,
		autoSortCreateKey : "bookmarkauto_oncreate",
		autoSortTimedKey : "bookmarkauto_timed",
		autoSortPriorityKey : "bookmarkauto_priority"
	},
}

/******* BOOKMARK SORTER *******/

function attachCreateSort() {
	/* When a bookmark is created, it will be moved to an appropriate Title folder." */
	chromeBookmarkOnCreated(onCreatedListener);
}

function attachIntervalSort() {
	/* On a timed interval, older bookmarks will be archived to a Category folder and loose bookmarks will be sorted. */
	chromeDeployAlarm(SmartBookmarks.config.bookmarkAlarm, intervalAlarm, SmartBookmarks.config.autoSortMinutes); 
}

function attachVisitSort() {
	/*When visiting a URL, a matching bookmark will be moved up. <TODO?> If it's in an archive, it will be taken out. */
	chromeHistoryOnVisited(onVisitedListener);
}

function detachCreateSort() {
	chromeBookmarksDetachCreated(onCreatedListener);
}

function detachIntervalSort() {
	chromeAlarmsDetach(SmartBookmarks.config.bookmarkAlarm);
}

function detachVisitSort() {
	chromeHistoryDetachVisited(onVisitedListener);
}

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

function disableAutomaticSort() {
	detachCreateSort();
	detachIntervalSort();
	detachVisitSort();
}

function onCreatedListener(id, bookmark)
{
	// Sort the bookmark by title
	sortBookmarkByTitle(id, bookmark, bookmark.url);
}

function onVisitedListener(result)
{
	var url = result.url;
	// Get the base url
	var baseUrl = getBaseUrl(url);

	// Check if a matching bookmark exists
	searchBookmarks(baseUrl, function(results) {
		var result = results[0];

		// Matching bookmark to url exists
		if(result !==  undefined)
		{
			var parentId = result.parentId;	
	
			// If a matching bookmark exists, move itself and its parent up one unit
			getBookmark(parentId, function(results){
				var parentBookmark = results[0];
				
				if(parentBookmark !== undefined)
				{
					console.log(parentBookmark);
					var parentIndex = parentBookmark.index;
					var childIndex = result.index;
					
					// take care not to move anything outside of "Other bookmarks"
					if(parentBookmark.parentId === SmartBookmarks.config.otherBookmarks) {
						var newParentIndex = parentIndex > 0 ? parentIndex - 1 : 0;
						var newChildIndex = childIndex > 0 ? childIndex - 1 : 0;
						var parentDestination = {
							parentId : parentBookmark.parentId,
							index : newParentIndex
						};
						var childDestination = {
							parentId : parentBookmark.id,
							index : newChildIndex
						};
						// Move the parent up one unit
						moveBookmark(parentBookmark.id, parentDestination, function(result){});
						// Move the child up one unit
						moveBookmark(result.id, childDestination, function(result){});
					}
				}
			});
		}
		// Otherwise, do nothing.
	});
}

function intervalAlarm(alarm)
{
	// Get the local counter or start it at 0
	var me = this;
	var counterKey = SmartBookmarks.config.indexCounter;
	var counterValue = jQueryStorageGetValue(counterKey) || 0;
	console.log("interval alarm at counter = ", counterValue);
	// Get the bookmark children in Other Bookmarks
	getBookmarkChildren(SmartBookmarks.config.otherBookmarks, function(results) {
		// Get the bookmark at the current index
		var bookmark = results[counterValue];
		
		if(bookmark !== undefined) {

			console.log("Found a bookmark by the name ", bookmark.title);
			
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
								sortBookmarkByCategory(myId, bookmark, url);		
							} else {
								// Sort the bookmark by title
								console.log("by title");
								sortBookmarkByTitle(myId, bookmark, url);
							}
						} else {
							// No history on this item... sort it by category.
							console.log("*****ALERT***** NO VISIT RESULTS...?");

							sortBookmarkByCategory(myId, bookmark, url);		
						}
					} else {
						// No history on this item...sort it by category
							console.log("*****ALERT***** NO VISIT RESULTS");
							sortBookmarkByCategory(myId, bookmark, url);		
					}
				});
			}
		}
			
		// Otherwise, do nothing.
	
		// Set the counter to the next index, or 0 if it is the tail
		var incCounter = counterValue < results.length ? counterValue + 1 : 0;
		console.log("Setting the counter from ", counterValue, " to ", incCounter );

		jQueryStorageSetValue(counterKey, incCounter);
	});
}

function sortBookmarkByCategory(id, bookmark, url) {
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
								
				/* Search for a folder matching the result, create the folder if necessary, and move the bookmark to it */
				searchAndCreate(id, bookmark, category);
			}
		});
	} else {
		// Cached category
		var category = cachedData.category;
		
		// Search for a folder matching the result, create the folder if necessary, and move the bookmark to it
		me.searchAndCreate(id, bookmark, category);	
	}
}

function sortBookmarkByTitle(id, bookmark, url) {
		// Check local cache to see if the base URL has associated data.
		var cachedData = jQueryStorageGetValue(url),
			me = this;
		
		// Get the base url
		var baseUrl = getBaseUrl(url);
		console.log("ID = ", id, "BOOKMARK=", bookmark);
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
								console.log("TITLE=", title);

					// Search for a folder matching the result, create the folder if necessary, and move the bookmark to it
					searchAndCreate(id, bookmark, title);
				}
				else {
					console.log("FAIL=", data);

				}
			});
		}
		else 
		{
			// Cached title
			var title = cachedData.title;
			console.log("TITLEcach=", title);

			// Search for a folder matching the result, create the folder if necessary, and move the bookmark to it
			me.searchAndCreate(id, bookmark, title);
		}
}

/*
	Create two folders (one inside other) and move a bookmark to the 2nd folder
	If I had any good understanding of functional programming, all of the code in this file would be cleaner
*/
function createAndMove(folderA, folderB, id) {
	

}

/*
	Create folder with specified parentID with name, callback
*/
function createFolder(title, parentId, callback) {
		var me = this;
		var myBookmark = bookmark;
		var myFolderName = foldername;
		searchFolders(function(bookmark) {return bookmark !== undefined && bookmark.title == foldername && bookmark.url == undefined;}, function(ret) {
			if(ret.length > 0){
				// Folder already exists - invoke the callback
				callback.call(me, ret);
			}
			else {
				// Create the folder and move to it	
				console.log("New folder: ", myFolderName);
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

function searchAndCreate(id, bookmark, foldername){
		var me = this;
		var myId = id;
		var myBookmark = bookmark;
		var myFolderName = foldername;
		searchFolders(function(bookmark) {return bookmark !== undefined && bookmark.title == foldername && bookmark.url == undefined;}, function(ret) {
			if(ret.length > 0){
				// Move to the existing folder
				//console.log("Search returned : ",ret);
				var target = ret[0];
				
				if(target != undefined){
					var destination = {
						index : 0,
						parentId : target.id
					};
					moveBookmark(myId, destination, function(result){
						console.log("SUCCESSFUL MOVE ",result);					
					});
				}
			}
			else {
				// Create the folder and move to it	
				console.log("New folder: ", myFolderName);
				var folder = {
					title : myFolderName,
				};
	
				// Disable the bookmark onCreate listener, because programmatic creation of bookmarks/folders will kick off the event
				me.chromeBookmarksDetachCreated(onCreatedListener);
				// Create the folder
				me.createBookmark(folder, function(result) {
					
					// Create may fail if the hourly quota is reached
					if(result !== undefined) {
						// Move to the new folder
						var destination = {
							index : 0,
							parentId : result.id
						};
						
						// Move the url to that folder
						moveBookmark(myId, destination, function(result){
							console.log("SUCCESSFUL MOVE ",result);
						});
					}
					else {
						console.log("CREATE FAILED..");
					}
				});
				// Enable the bookmark onCreate listener
				me.chromeBookmarkOnCreated(me.onCreatedListener);
			}
		});
}

/*
Sort a sample of bookmarks
*/
function sortSample()
{
	sortOtherBookmarks(SmartBookmarks.config.sampleNumber);
}

/* 
Manually sort the other bookmarks folder
*/
function sortOtherBookmarks(num)
{
	// Get the ID of other bookmarks folder
	getBookmarkChildren(SmartBookmarks.config.rootBookmarksKey.toString(), function(results) {
		var id = results[SmartBookmarks.config.otherBookmarksKey].id;
		sortBookmarks(id, num);	
	});
}

/*
Manually sorts specified amount of bookmarks. If left undefined, sorts all bookmarks
Be sure to go into subfolders

NOTE: this code is broken..it doesn't count how many bookmarks it has sorted when it recurses into folders.
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
										// Sort the bookmark by category
										sortBookmarkByCategory(myId, bookmark, url);		
									} else {
										// Sort the bookmark by title
										sortBookmarkByTitle(myId, bookmark, url);
									}
								} else {
									// No history on this item... sort it by category.
									sortBookmarkByCategory(myId, bookmark, url);		
								}
							} 
							
						});	
					} else {
						// Recurse into the folder
						//sortBookmarks(myId, numSorts - i);
					}
				}
			})(bookmark)
		}	
	});
}


/*
* Set the API key in local storage
*/
function setApiKey(apikey) 
{
	jQueryStorageSetValue(SmartBookmarks.config.bookmarksort_apikey, apikey);
}

/*
* Get the API key in local storage
*/
function getApiKey()
{
	return jQueryStorageGetValue(SmartBookmarks.config.bookmarksort_apikey);
}

/*
Set auto on create
*/
function setAutoOnCreate(value)
{
	jQueryStorageSetValue(SmartBookmarks.config.autoSortCreateKey, value);
}

/*
* Get the auto onCreate value
*/
function getAutoOnCreate()
{
	return jQueryStorageGetValue(SmartBookmarks.config.autoSortCreateKey);
}

/*
Set auto timed key
*/
function setAutoInterval(value)
{
	jQueryStorageSetValue(SmartBookmarks.config.autoTimedKey, value);
}

/*
* Get the auto interval key
*/
function getAutoInterval()
{
	return jQueryStorageGetValue(SmartBookmarks.config.autoTimedKey);
}

/*
Set auto prioritize
*/
function setAutoPrioritize(value)
{
	jQueryStorageSetValue(SmartBookmarks.config.autoSortPriorityKey, value);
}

/*
* Get the auto prioritize value
*/
function getAutoPrioritize()
{
	return jQueryStorageGetValue(SmartBookmarks.config.autoSortPriorityKey);
}

/*
* Set old bookmark days for determining whether or not to archive
*/
function setOldBookmarkDays(value)
{
	jQueryStorageSetValue(SmartBookmarks.config.oldBookmarkDaysKey, value);
}

/*
* Get old bookmark days for determining whether or not to archive
*/
function getOldBookmarkDays()
{
	return jQueryStorageGetValue(SmartBookmarks.config.oldBookmarkDaysKey) || SmartBookmarks.config.oldBookmarkDaysDefault;
}
/*
Distributes a given number of sort operations over 24 hours in milliseconds
*/
function distributeUnits(operations, time)
{
	return 1000 * 1 / Math.floor(operations / (60 * 60));
}

function getBaseUrl(url)
{
	pathArray = String(url).split( '/' ); 
	host = pathArray[2]; 
	return host;
}

// Courtesy of Michael Liu at http://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-jquery
function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}

/******* JQUERY *******/
/*
/*Make a JQuery REST request with the given parameters with the given callback*/
function jqueryREST(requestURL, data, callback, dataType)
{
	jQuery.get(requestURL, data, callback, dataType);
}

/*
/*Make a JQuery local store query
*/
function jQueryStorageGetValue(key)
{
	return $.totalStorage(key);
}

/*
/* Set a local storage value
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
		outputMode : this.SmartBookmarks.config.outputMode
	};
	
	var dataType = "json";
	var requestURL = this.SmartBookmarks.config.requestCategoryURL;
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
		outputMode : this.SmartBookmarks.config.outputMode
	};
	
	var dataType = "json";
	var requestURL = this.SmartBookmarks.config.requestCategoryURL;
	
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
		outputMode : this.SmartBookmarks.config.outputMode
	};
	
	var dataType = "json";
	var requestURL = this.SmartBookmarks.config.requestTitleURL;
	
	//API request for getting the category of a URL
	this.jqueryREST(requestURL, data, callback, dataType);
	
}

/*
Make an Alchemy API Topic REST request
*/
function alchemyTopic(url, callback)
{
	// Get the api key from local storage
	var apikey = getApiKey();

	//Create a local data object for the API request 
	var data = { 
		url : url,
		apikey : apikey,
		outputMode : this.SmartBookmarks.config.outputMode
	};
	
	var dataType = "json";
	var requestURL = this.SmartBookmarks.config.requestTopicURL;
	
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
function getOtherBookmarks(callback)
{

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
