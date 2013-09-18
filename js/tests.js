QUnit.begin(function() {
	SmartBookmarkSorter.setApiKey("f3c34a16c40928e82a9b1d6d8997e78464da139a");
});

test( "test", function() {
  ok( 1 == "1", "Passed!" );
});

asyncTest("Category request is successfully made", 1, function() {
	
	var callback = function(data, textStatus, jqXHR) {
		var category = data.category,
			status = data.status,
			statusInfo = data.statusInfo,
			score = data.score;
			
		equal(category, "recreation");
		start();
	};
	
	SmartBookmarkSorter.alchemyCategory("http://stackoverflow.com", callback);
});

asyncTest("Title request is successfully made", 1, function() {
	
	var callback = function(data, textStatus, jqXHR) {
		var title = data.title,
			status = data.status,
			statusInfo = data.statusInfo,
			score = data.score;
			
		equal(title, "Stack Overflow");
		start();
	};
	
	SmartBookmarkSorter.alchemyTitle("http://stackoverflow.com", callback);
});

/*
asyncTest("A single bookmark is sorted", 1, function() {
	var callback = function() {
		
	};
	
	var bookmark = {
		title: "Stack Overflow Test",
		url: "http://stackoverflow.com"
	}
	var deferred = $.Deferred();
	chrome.bookmarks.create(bookmark, function(result) {
		sortBookmark(result, deferred,
	});
});
* */

QUnit.done(function() {
	var items = $.totalStorage.getAll();
	
	for(var i = 0;i<items.length;++i)
	{
		$.totalStorage.deleteItem(items[i].key);
	}
});
