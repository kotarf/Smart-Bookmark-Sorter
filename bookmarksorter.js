// Copyright (c) 2013 ICRL

// See the file license.txt for copying permission.


/******* BOOKMARK SORTER *******/
define(["jquery", "underscore", "jqueryhelpers", "storage", "chromeinterface", "alchemy", "config", "sharedbrowser", "lib/purl", ], function($, _, jhelpers, storage, chromex, alchemy, config, shared) {
	return {

		/**
		 * Enable the automatic create sort.
		 * Sorts bookmarks as they are created
		 */
		attachCreateSort : function () {
			/* When a bookmark is created, it will be moved to an appropriate Title folder." */
            chromex.chromeBookmarkOnCreated(this.onCreatedListener);
		},

		/**
		 * Enable the automatic timed sort.
		 * Sorts older bookmarks on a timed interval.
		 */
		attachIntervalSort : function () {
			/* On a timed interval, older bookmarks will be archived to a Category folder and loose bookmarks will be sorted. */
            chromex.chromeDeployAlarm(config.bookmarkAlarm, this.intervalAlarm, config.autoSortMinutes);
		},

		/**
		 * Enable the automatic visit sort.
		 * Will send bookmarks to the top as they are accessed.
		 */
		attachVisitSort : function () {
			/*When visiting a URL, a matching bookmark will be moved up. <TODO?> If it's in an archive, it will be taken out. */
            chromex.chromeHistoryOnVisited(this.onVisitedListener);
		},

		/**
		 * Detaches the automatic create sort
		 */
		detachCreateSort : function () {
            chromex.chromeBookmarksDetachCreated(this.onCreatedListener);
		},

		/**
		 * Detaches the automatic interval sort
		*/
		detachIntervalSort : function () {
			// TODO clear alarm by name
            chromex.chromeClearAlarms();
		},

		/**
		 * Detaches the automatic visit sort
		*/
		detachVisitSort : function () {
            chromex.chromeHistoryDetachVisited(this.onVisitedListener);
		},

		/**
		 * Enables automatic sort
		 * Checks local storage configuration values to determine which sorts to enable
		*/
		enableAutomaticSort : function () {
			var me = this,
				isOnCreate = me.getAutoOnCreate(),
				isOnInterval = me.getAutoInterval(),
				isPrioritize = me.getAutoPrioritize(),
				isSorting = me.getIsSorting();

			if(isOnCreate && !isSorting) {
                me.attachCreateSort();
            }

			if(isOnInterval) {
                me.attachIntervalSort();
            }

			if(isPrioritize) {
                me.attachVisitSort();
            }

		},

		/**
		 * Disables automatic sort
		 * Drops all of the attached sorts
		*/
		disableAutomaticSort : function () {
			var me = this;
			me.detachCreateSort();
			me.detachVisitSort();
			me.detachIntervalSort();
		},

		/**
		 * Listener for the onCreated automatic sort
		 * @param {id} id The id of the bookmark that was just created.
		 * @param {bookmark} bookmark The bookmark that was just created.
		 */
		onCreatedListener : function (id, bookmark)
		{
			console.log("****************ON CREATE LISTENER KICKED OFF****************", id, bookmark);
			// Sort the bookmark by title
			var me = this,
				SBS = me.SmartBookmarkSorter,
				deferred = $.Deferred();

			// Always re-attach create sort if it should be enabled, but only after a bookmark is sorted
			deferred.always(function() {
				storage.setIsOnCreateSorting(false);

				// If auto create should be on, re-attach it
				if (SBS.getAutoOnCreate() && SBS.getAutoOn() && !SBS.getIsSorting()) {
					SBS.attachCreateSort();
				}

			});

			// Set is sorting
            storage.setIsOnCreateSorting(true);

			// Disable the bookmark onCreate listener, because programmatic creation of bookmarks/folders will kick off the event
			SBS.detachCreateSort();

			SBS.sortBookmark(bookmark, function(){
				deferred.resolve();
			}, deferred);
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
				SBS = me.SmartBookmarkSorter,
				isSorting = SBS.getIsSorting();

			// Check if any sorting is in progress, if so do not move anything
			if (!isSorting) {
				// Check if a matching bookmark exists
				SBS.searchBookmarks(url, function(results) {
					var result = results[0];

					// Matching bookmark to url exists
					if(result !==  undefined)
					{
						var id = result.id;
						var parentId = result.parentId;

						if ( parentId !== SBS.config.rootBookmarksId ) {

							// Move it to the top of other bookmarks if it's not in root bookmarks
							SBS.getOtherBookmarks(function(result) {

								var otherBookmarksId = result.id;

								var destination = {
									parentId : otherBookmarksId,
									index : 0
								};

								chromex.moveBookmark(id, destination, function() {});
							});
						}
					}
					// Otherwise, do nothing.
				});
			}
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
			var me = this.SmartBookmarkSorter,
				counterKey = me.config.indexCounter,
				counterValue = jhelpers.jQueryStorageGetValue(counterKey) || 0;
			console.log("Interval alarm - ", counterValue);
			// Get the ID of other bookmarks folder
			me.getBookmarkChildren(me.config.rootBookmarksIndex.toString(), function(results) {
				var otherBookmarksId = results[me.config.otherBookmarksIndex].id;

				// Get the children of other Bookmarks
				me.getBookmarkChildren(otherBookmarksId, function(results) {
					// Get the bookmark at the current index
					var bookmark = results[counterValue];

					if(bookmark !== undefined) {
						// Check if the URL hasn't been visited in a while
						var title = bookmark.title,
							url = bookmark.url,
							myId = bookmark.id,
							baseUrl = jhelpers.getBaseUrl(url),
							deferred = $.Deferred();

						// Could be a folder
						if(url !== undefined)
						{
							// Always re-attach create sort if it should be enabled, but only after a bookmark is sorted
							deferred.always(function() {
                                storage.setIsOnAlarmSorting(false);

								if (me.getAutoOnCreate() && me.getAutoOn() && !me.getIsSorting()) {
									me.attachCreateSort();
								}

							});

							// Set is sorting
                            storage.setIsOnAlarmSorting(true);

							// Disable the bookmark onCreate listener, because programmatic creation of bookmarks/folders will kick off the event
							me.detachCreateSort();

							// Sort the bookmark if it's older than the configured amount
							me.sortIfOld(bookmark, me, function(result, deferred){
								deferred.resolve();
							}, deferred);
						}
					}
					// Otherwise, do nothing.

					// Set the counter to the next index, or 0 if it is the tail
					var incCounter = counterValue < results.length ? counterValue + 1 : 0;

                    jhelpers.jQueryStorageSetValue(counterKey, incCounter);
				});
			});
		},

		/**
		 * Attach import listeners
		 */
		attachImportListeners : function() {
            chromex.chromeOnImportBegan(this.onImportBeganListener);
            chromex.chromeOnImportEnd(this.onImportEndListener);
		},

		/**
		 * When an import starts, disable automatic sort
		 */
		onImportBeganListener : function () {
			// When an import starts, disable automatic sort
			var me = this.SmartBookmarkSorter;

			me.disableAutomaticSort();
		},

		/**
		 * When an import ends, enable automatic sort if it is configured to be enabled
		 */
		onImportEndListener : function() {
			// When an import ends, enable automatic sort
			var me = this.SmartBookmarkSorter,
				isAutoSort = me.getAutoOn();

			if (isAutoSort) {
				me.enableAutomaticSort();
			}
		},

        /**
         * Sorts a single bookmark
         * Makes two folders - one for category, and one for concept - and moves the bookmark in the concept folder.
         * @param {BookmarkTreeNode} bookmark The bookmark to sort. In Firefox, this will be adapted to be identical to a Chrome object.
         * @return {object} deferred The deferred object to resolve [JQuery whenSync].
         */
        sortBookmarkEx : function (bookmark, rootId, sortAction, maxLevels) {
            // Make a deferred
            var dfd = $.Deferred(),
				bookmark = bookmark,
				rootId = _.isUndefined(rootId) ? config.rootBookmarksId : rootId,
				maxLevels = maxLevels || config.defaultTaxonomyLevels;

			shared.createFolderIfNotExists(config.archivesFolder, rootId).done(function(archivesId) {
				// ...sorting...
				shared.createFoldersByTaxonomy(bookmark.url, archivesId, maxLevels).done(function() {
					var folderIds = arguments[0],
						lastFolderId = folderIds[folderIds.length - 1];

					// Copy the bookmark (default)
					if(sortAction) {
						shared.createBookmarkIfNotExists(lastFolderId, bookmark.title, bookmark.url).done(function(id, parentId) {
							dfd.resolve(id, parentId);
						});
					}
					else {
						// Otherwise, move the bookmark
						shared.moveBookmark(bookmark.id, lastFolderId).done(function (id, parentId) {
							dfd.resolve(id, parentId);
						});
					}
				}).fail(function() {
					console.log("Failed to create folders by taxonomy.");
				});
			}).fail(function() {
				deferred.reject(bookmark);
			});

            // Return a promise
            return dfd.promise();
        },

        sortBookmarksEx: function (bookmarks, rootId, sortAction, maxLevels) {
            var me = this,
                dfd = $.Deferred(),
				rootId = _.isUndefined(rootId) ? config.rootBookmarksId : rootId;

			var count = 0;
            var defFunctors = _.map(bookmarks, function (bookmark) {
                return function () {
                    var deferred = arguments[0];
					// rootId = rootId // why is that a problem?

                    // Resolve the deferred in the future.
                    me.sortBookmarkEx(bookmark, rootId, sortAction, maxLevels).done(function(id, parentId) {
                        deferred.resolve({id: id, parentId: parentId});
						dfd.notify(count);
                    });

					count++;
                };
            });

            var asyncChain = jhelpers.jQueryWhenSync(me, defFunctors);

            asyncChain.done(function(results) {
                dfd.resolve(arguments);
            });

            asyncChain.fail(function(results) {
                dfd.fail(results);
            });

            return dfd.promise();
        },

		/**
		 * Sorts a single bookmark
		 * Makes two folders and puts the bookmark in the 2nd folder
		 * @param {BookmarkTreeNode} bookmark The bookmark to sort.
		 * @param {function} callback The callback to run when successful.
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
						chromex.moveBookmark(bookmark.id, destination, function(result){
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

			if (bookmark !== undefined) {
				var myId = bookmark.id;
				var url = bookmark.url;
				// It may be a folder
				if (url !== undefined) {
					var oldBookmarkDays = me.getOldBookmarkDays();

					// Get visits for the url
                    chromex.chromeGetVisits(url, function(results){
						if(results !== undefined) {
							var visit = results[0];
							if (visit !== undefined)
							{
								var visitTime = visit.visitTime;
								var currentTime = new Date();
								var daysBetween = me.daysBetween(visitTime, currentTime.getTime());

								if (oldBookmarkDays === 0 || ( daysBetween > oldBookmarkDays) ) {
									// Sort the bookmark
									me.sortBookmark(bookmark, callback, deferred);
								} else {
									// Move the bookmark to the top of other bookmarks
									me.getOtherBookmarks(function(result) {

										var otherBookmarksId = result.id;

										var destination = {
											parentId : otherBookmarksId,
											index : 0
										};

										chromex.moveBookmark(myId, destination, function() {
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
		 * Sort a sample of bookmarks in Other Bookmarks
		 * @config {int} [sampleNumber] The number of bookmarks to sort in this sample
		 */
		sortSample : function ()
		{
			this.sortToplevelBookmarks(config.sampleNumber);
		},

		/**
		 * Sort all bookmarks in Other Bookmarks
		 */
		sortAllBookmarks : function()
		{
			this.sortSubBookmarks(undefined);
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
		 * @config {string} sortBeginMsg Successful message code sent to UI
		 * @config {string} sortSuccessfulMsg Successful message code sent to UI
		 * @config {string} sortCompleteMsg Successful message code sent to UI
		 * @config {boolean} isSorting Successful Local storage variable for in progress sorting
		 */
		sortBookmarks : function (result, num, callback)
		{
			var me = this;

			// Make an array of sort functors
			var sortFuncts = [],
				length = (num !== undefined && num < result.length) ? num : result.length;

			// Send a message saying the sorting has begun
            chromex.chromeSendMessage(me.config.sortBeginMsg + "," + length);

			// Set a local storage variable to sorting in progress
            storage.setIsOnManualSorting(true);

			// Detach create sort
			me.detachCreateSort();

			// Generate the asynchronous calls in the chain
			for(i = 0; i < length; i++) {
				// Closure
				(function(bookmark, index) {
					// Push a function to sort a bookmark at the chained index
					sortFuncts.push(
						function () {
							var deferred = arguments[0];

							me.sortIfOld(bookmark, me, function(result, deferred) {
								// Send a message to the UI saying there was a successful conversion at the specified index
								var msgSort = index;

								// Send a message to the UI with the bookmark that was just sorted
								chromex.chromeSendMessage(me.config.sortSuccessfulMsg + "," + msgSort);

								// Resolve the deferred object, allowing the chain to continue
								deferred.resolve(index);
							}, deferred);
						}
					);
				})(result[i], i);
			}

			// Chained asynchronous callbacks
			var asyncChain = jhelpers.jQueryWhenSync(me, sortFuncts);

            // Bind the done callback to the asynchronous chain.
            asyncChain.done(
                function(){
                    // Execute the completion callback
                    callback.call(me);
                }
            );

            // Bind the always callback to the asynchronous chain
            asyncChain.always(
                function() {
                    // Set that we are no longer sorting
                    storage.setIsOnManualSorting(false);

                    // Send a message to the UI saying we're done
                    chromex.chromeSendMessage(SmartBookmarkSorter.config.sortCompleteMsg);

                    // Reattach the create sort listener if it is enabled
                    if (me.getAutoOnCreate() && me.getAutoOn() && !me.getIsSorting()) {
                        me.attachCreateSort();
                    }
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
            chromex.chromeGetSubTree(id, function(results) {
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
                chromex.searchFolders(result.id, function(bookmark){return bookmark.url === undefined;}, function(ret) {
					// Loop through
					me.forEach(ret, function(bookmark) {
						// If I'm empty, remove me
						me.getBookmarkChildren(bookmark.id, function(results) {
							if (results.length == 0) {
								chromex.removeBookmark(bookmark.id, function(){});
							}
						});
					});
				});

			});
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
		}

	};
});