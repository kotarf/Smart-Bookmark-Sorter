/**
 * Created by kotarf on 8/25/14.
 */
define({
    /** SmartBookmarkSorter configuration properties. These are all constants. */
    requestCategoryURL : 		"http://access.alchemyapi.com/calls/url/URLGetCategory",
    requestTitleURL : 			"http://access.alchemyapi.com/calls/url/URLGetTitle",
    requestTaxonomyURL : 		"http://access.alchemyapi.com/calls/url/URLGetRankedTaxonomy",
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
    categoryErrorScore :		0.01,
    taxonomyErrorScore :		0.55,
    unsortedFolderName :		"unsorted",
    redoCode :					"_REDO",
    okStatus : 					"OK",
    errorStatus :               "ERROR",
    dailyLimitError : 			"daily-transaction-limit-exceeded",
    invalidApiKeyError :        "invalid-api-key",
    cannotRetrieveError :       "cannot-retrieve",
    pageNotHtmlError :          "page-is-not-html",
    sortBeginMsg :				"sortBegin",
    sortSuccessfulMsg : 		"sortSuccessful",
    sortCompleteMsg : 			"sortComplete",
    isSortingKey :				"isSorting",
    isOnCreateSortingKey :		"isSortingOnCreate",
    isOnIntervalSortingKey :	"isSortingInterval",
    isOnManualSortingKey :		"isSortingManual",
    categoryProperty:           "category",
    titleProperty:              "title",
    taxonomyProperty:           "taxonomy"
});