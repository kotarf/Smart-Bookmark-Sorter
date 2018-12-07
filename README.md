Smart-Bookmark-Sorter
=====================

Automatically sort bookmarks based on their taxonomy

Update 12/2018:
This extension relied upon AlchemyAPI for taxonomy and categorization results given URLs. AlchemyAPI was purchased by IBM sometime in 2015, and AlchemyAPI itself was officially merged into IBM Watson in April 2017. As of April 2017, it has no longer been possible to register a new and free installation of AlchemyAPI. This extension cannot be run without such a license, and so it's academic at the current time. I'm looking into moving to a different provider for categorization & taxonomy results as there are a number of new ones these days (that also appear to offer a free version).

Version history (on chrome store)

"0.0.0.1", Initial release
"0.0.0.2", Fix image names in popup.html
"0.0.0.3", Privacy confirmation
"0.0.0.4", One line change
"0.0.0.5", Bugs #7, #8, #9
"0.0.0.6", Bugs #7, #8, #9
"0.0.0.7", Bug #11 Auto sort would infinitely sort
"0.0.0.8", Bug #11 Manual, on create, and interval sorting all set different flags for sorting in progress
"0.0.0.9", Version in about page
"0.0.1.0", Check if sorting is in progress before attaching create listener in enable auto sort
"0.0.1.1", Imports will temporarily disable automatic sort, visit sort will not move if bookmarking is in progress, clear all interval alarms because duplicates were noticed on Chromium
"0.0.1.2", New logo, promo images. Switched to MIT license.
"0.0.1.3", Bug #15
"0.2.0.2", Major enhancements and remodeling to the architecture of the extension. Sorting is by taxonomy now, and folders are selected through a dynamically created tree. Auto-sort functionality is more efficient, configurable and less intrusive.
"0.2.0.3", onInstalled initialization for event page
"0.2.0.4", use domReady correctly
"0.2.0.5", lower bad score threshold and do not delete bookmarks when set to move and they already exist in output
