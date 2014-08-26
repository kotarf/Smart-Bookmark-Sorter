/**
 * Created by kotarf on 8/25/14.
 */
define({
    /** SmartBookmarkSorter configuration properties. These are all constants. */
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
    autoSortMinutes : 			5,
    indexCounter : 				"bookmarkIndexCounter",
    oldBookmarkDaysDefault : 	7,
    bookmarkAlarm : 			"bookmarkAlarm",
    rootBookmarksId : 			"1",
    rootBookmarksIndex : 		0,
    otherBookmarksIndex : 		1,
    sampleNumber : 				5,
    categoryErrorScore :		0.5,
    unsortedFolderName :		"unsorted",
    redoCode :					"_REDO",
    okStatus : 					"OK",
    dailyLimitError : 			"daily-transaction-limit-exceeded",
    sortBeginMsg :				"sortBegin",
    sortSuccessfulMsg : 		"sortSuccessful",
    sortCompleteMsg : 			"sortComplete",
    isSortingKey :				"isSorting",
    isOnCreateSortingKey :		"isSortingOnCreate",
    isOnIntervalSortingKey :	"isSortingInterval",
    isOnManualSortingKey :		"isSortingManual"
});