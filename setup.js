$(function() {
	// Get the background page and automatic sort
	var background_page = chrome.extension.getBackgroundPage(),
		isAutoSort = background_page.SmartBookmarkSorter.getAutoOn();
		
	// Enable automatic sort feature if storage says it is enabled
	if(isAutoSort) {
		background_page.SmartBookmarkSorter.enableAutomaticSort();
	} else {
		background_page.SmartBookmarkSorter.disableAutomaticSort();
	}
	
	// Attach import listeners
	background_page.SmartBookmarkSorter.attachImportListeners();
});
