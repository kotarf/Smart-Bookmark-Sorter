// Copyright (c) 2013 ICRL

// See the file license.txt for copying permission.


/******* BOOKMARK SORTER *******/
define(["jquery", "underscore", "jqueryhelpers", "storage", "alchemy", "config", "sharedbrowser", "lib/purl", ], function($, _, jhelpers, storage, alchemy, config, shared) {
	return {
        /**
         * Sorts a single bookmark via chained promises
         * Makes two folders - one for category, and one for concept - and moves the bookmark in the concept folder.
         * @param {BookmarkTreeNode} bookmark The bookmark to sort. In Firefox, this will be adapted to be identical to a Chrome object.
		 * @config {boolean} isSorting Successful Local storage variable for in progress sorting
		 * @return {object} deferred The deferred object to resolve [JQuery whenSync].
         */
        sortBookmarkEx : function (bookmark, archivesId, options) {
            // Make a deferred
            var dfd = $.Deferred(),
				bookmark = bookmark,
				options = options || {sortAction: true, maxLevels: config.defaultTaxonomyLevels, archivesFolder: config.archivesFolder},
				sortAction = options.sortAction,
				maxLevels = options.maxLevels || config.defaultTaxonomyLevels;

			// ...sorting...
			shared.createFoldersByTaxonomy(bookmark.url, archivesId, maxLevels).done(function() {
				var folderIds = arguments[0],
					lastFolderId = folderIds[folderIds.length - 1];

				// Copy the bookmark
				if(sortAction) {
					shared.createBookmarkIfNotExists(lastFolderId, bookmark.title, bookmark.url).done(function(id, parentId) {
						dfd.resolve(id, parentId);
					});
				}
				else {
					// Otherwise, move the bookmark
					shared.moveBookmarkIfNotExists(bookmark, lastFolderId).done(function (id, parentId) {
						dfd.resolve(id, parentId);
					});
				}
			}).fail(function() {
				console.log("Failed to create folders by taxonomy.");
				dfd.reject();
			});


            // Return a promise
            return dfd.promise();
        },

        sortBookmarksEx: function (bookmarks, rootId, options) {
            var me = this,
                dfd = $.Deferred(),
				rootId = _.isUndefined(rootId) ? config.rootBookmarksId : rootId,
				archivesFolder = options.archivesFolder || config.archivesFolder,
				cull = options.cull || false;

			// Set a local storage variable to sorting in progress
			storage.setIsOnManualSorting(true);

			shared.createFolderIfNotExists(archivesFolder, rootId).done(function(archivesId) {
				var count = 0;
				var defFunctors = _.map(bookmarks, function (bookmark) {
					return function () {
						var deferred = arguments[0];
						// rootId = rootId // why is that a problem?

						// Resolve deferred in the future.
						me.sortBookmarkEx(bookmark, archivesId, options).done(function(id, parentId) {
							deferred.resolve({id: id, parentId: parentId});
							dfd.notify(count);
						});

						count++;
					};
				});

				var asyncChain = jhelpers.jQueryWhenSync(me, defFunctors);

				asyncChain.always(function() {
					// Set a local storage variable to finished sorting
					storage.setIsOnManualSorting(false);
				});

				asyncChain.done(function() {
					if(cull) {
						/// TODO cull folder here
						console.log("Would be culling");
					}
					else {
						dfd.resolve(archivesId, arguments);
						console.log("Not culling");
					}
				});
				asyncChain.fail(function(results) {
					dfd.reject(results);
				});
			}).fail(function() {
				dfd.reject();
			});

            return dfd.promise();
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
		}
	};
});