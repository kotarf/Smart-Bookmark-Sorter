/**
 * Created by kotarf on 8/9/2015.
 */
define(['sortapi', 'storage', 'sharedbrowser', 'chromeinterface', 'config', 'lib/Queue.src'], function(sortlib, storage, shared, chromex, config) {
   return {
       /**
        * Enable the automatic timed sort.
        * Sorts older bookmarks on a timed interval.
        */
       attachIntervalSort : function () {
           /* On a timed interval, older bookmarks will be archived to a Category folder and loose bookmarks will be sorted. */
           var alarmTime = storage.getAutosortMinutes();
           console.log("Attaching.", alarmTime);
           chromex.chromeDeployAlarm(config.bookmarkAlarm, this.sortOnInterval, alarmTime);
       },

       /**
        * Detaches the automatic interval sort
        */
       detachIntervalSort : function () {
           // TODO clear alarm by name
           chromex.chromeClearAlarms();
       },

       /**
        * Enables automatic sort
        * Checks local storage configuration values to determine which sorts to enable
        */
       enableAutomaticSort : function (sort, prioritize) {
           console.log("Enabling automatic sort");
           if(sort) {
               console.log("Enabling interval sort");

               this.attachIntervalSort();
           }

           if(prioritize) {
               //this.attachVisitSort();
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

       recentlySortedAlarm: function (alarm) {
            chromex.chromeGetRecentlyAddedItems(function(items) {

            });
       },

       sortIfOld: function(bookmark, dateThreshold) {
           var dateAdded = new Date(bookmark.dateAdded),
               today = new Date(),
               daysBetween = shared.daysBetween(dateAdded, today);

           if(daysBetween > dateThreshold) {
               console.log("Would be sorting", bookmark, dateThreshold);
               //sortlib.sortBookmarks(bookmark);
           }
           else {
               // Not sorting because too recent
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
       sortOnInterval : function ()
       {
           var me = this;

           var flattenTree = function(results, counterValue) {
               var queue = new Queue(),
                   bookmarks = [],
                   index = 0;

               queue.enqueue(results[0]);

               // Iterate through tree w/ queue. Add children folders to stack.
               while(!queue.isEmpty() && index < counterValue + 1) {
                   var bookmark = queue.dequeue(),
                       children = bookmark.children;

                   if(children) {
                       _.each(children, function(child) {
                           if(!shared.isFolder(child)) {
                               bookmarks.push(child);
                               index = index + 1;
                           }
                           else {
                               queue.enqueue(child);
                           }
                       });
                   }
               }

               return bookmarks;
           }

           // Get the local counters
           var autosortOther = storage.getAutosortOtherBookmarks(),
               autosortBar = storage.getAutosortBookmarksBar(),
               autosortMobile = storage.getAutosortMobileBookmarks(),
               manualSortInProgress = storage.getIsOnManualSorting(),
               dateThreshold = storage.getOldBookmarkDays();

           if(!manualSortInProgress) {
               if(autosortOther) {
                   shared.bookmarksSubTree(config.otherBookmarksId).done(function(results) {
                       var counterValue = storage.getAutosortCounterOther(),
                           bookmarks = flattenTree(results, counterValue);

                       // Get the bookmark at the current index in Other Bookmarks
                       var bookmark = bookmarks[counterValue],
                           incCounter = counterValue;

                       if(!_.isUndefined(bookmark)) {
                           me.AutoSort.sortIfOld(bookmark, dateThreshold);
                           incCounter = counterValue + 1;
                       }
                       else
                       {
                           incCounter = 0;
                       }

                       storage.setAutosortCounterOther(incCounter);
                   });
               }

               if(autosortBar) {
                   shared.bookmarksSubTree(config.rootBookmarksId).done(function(results) {
                       var counterValue = storage.getAutosortCounterBar(),
                            bookmarks = flattenTree(results, counterValue);

                       // Get the bookmark at the current index in bookmarks bar
                       var bookmark = bookmarks[counterValue],
                           incCounter = counterValue;

                       if(!_.isUndefined(bookmark)) {
                           me.AutoSort.sortIfOld(bookmark, dateThreshold);
                           incCounter = counterValue + 1;
                       }
                       else
                       {
                           incCounter = 0;
                       }

                       storage.setAutosortCounterBar(incCounter);
                   });
               }

               if(autosortMobile) {

                   shared.bookmarksSubTree(config.mobileBookmarksId).done(function(results) {
                       var counterValue = storage.getAutosortCounterMobile(),
                            bookmarks = flattenTree(results, counterValue);

                       // Get the bookmark at the current index in Mobile bookmarks
                       var bookmark = bookmarks[counterValue],
                           incCounter = counterValue;

                       if(!_.isUndefined(bookmark)) {
                           me.AutoSort.sortIfOld(bookmark, dateThreshold);
                           incCounter = counterValue + 1;
                       }
                       else
                       {
                           incCounter = 0;
                       }

                       storage.setAutosortCounterMobile(incCounter);
                   });
               }
           }
       },
   }
});