/**
 * Created by kotarf on 8/25/14.
 */
define({
    /** SmartBookmarkSorter configuration properties. These are all constants. */
    requestCategoryURL : 		"http://access.alchemyapi.com/calls/url/URLGetCategory",
    requestTitleURL : 			"http://access.alchemyapi.com/calls/url/URLGetTitle",
    requestTaxonomyURL : 		"http://access.alchemyapi.com/calls/url/URLGetRankedTaxonomy",
    outputMode : 				"json",
    autoSortMinutes : 			1,
    oldBookmarkDaysDefault : 	7,
    bookmarkAlarm : 			"bookmarkAlarm",
    rootBookmarksId : 			"1",
    rootBookmarksIndex : 		0,
    otherBookmarksIndex : 		1,
    sampleNumber : 				5,
    categoryErrorScore :		0.01,
    taxonomyErrorScore :		0.65,
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
    categoryProperty:           "category",
    titleProperty:              "title",
    taxonomyProperty:           "taxonomy",
    taxonomyNestedProperty:     "label",
    taxonomyDelimiter:          "/",
    archivesFolder:             "Archives",
    defaultTaxonomyLevels:      3,
    defaultCullNumber:          5
});