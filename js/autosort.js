/**
 * Created by kotarf on 8/9/2015.
 */
define(['sortapi', 'storage', 'sharedbrowser', 'chromeinterface', 'config', 'jqueryhelpers'], function(sortlib, storage, shared, chromex, config, jhelpers) {
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
           console.log("Attaching.");
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
       enableAutomaticSort : function (sort, prioritize, cull) {
           if(sort) {
               this.attachIntervalSort();
           }

           if(prioritize) {
               //this.attachVisitSort();
           }

           if(cull) {

           }
       },

       /**
        * Disables automatic sort
        * Drops all of the attached sorts
        */
       disableAutomaticSort : function () {
           var me = this;

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

       recentlySortedAlarm: function (alarm) {

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
               counterValue = storage.getAutosortCounter() || 0,
               manualSortInProgress = storage.getIsOnManualSorting();

           console.log("Event fired", counterValue, manualSortInProgress);
           if(!manualSortInProgress) {
               shared.bookmarksTree().done(function(results) {
                   // Get the bookmark at the current index
                   var bookmark = results[counterValue];

                   if(!_.isUndefined(bookmark)) {
                       if(!shared.isFolder(bookmark)) {
                           console.log("Would be sorting", bookmark);
                            //sortlib.sortBookmarks(bookmark);
                       }
                   }

                   // Set the counter to the next index, or 0 if it is the tail
                   var incCounter = counterValue < results.length ? counterValue + 1 : 0;

                   storage.setAutosortCounter(incCounter);
               });
           }
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
       }
   }
});