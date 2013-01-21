$(function() {
	var background_page = chrome.extension.getBackgroundPage();
	
	$( document ).tooltip();
	
	$( "#tabs" ).tabs({ heightStyle: "content" });

	// Get api key from local storage
	var key = SmartBookmarkSorter.getApiKey();

	if (key === null || key === undefined) {
		$('#tabs').tabs('disable', 1); // disable second tab
		$('#tabs').tabs('disable', 2); // disable third tab
		$('#tabs').tabs('disable', 3); // disable fourth tab
	}
	else {
		$('#tabs').tabs('disable', 0); // disable first tab
		$( "#tabs" ).tabs( "select", 2);
	}

	$( "#autocomplete_apikey" ).autocomplete({
		source: []
	});
	
	$( "#button_key").button().click(function() {
		var key =  $("#autocomplete_apikey").val();
		// Test the API key to see if it is valid
		SmartBookmarkSorter.alchemyKeyTest( key, 
			function() { 
				// Save the state and the key
				SmartBookmarkSorter.setApiKey(key);
				
				$('#tabs').tabs('disable', 0); // disable first tab
				
				// Unlock and go to the next tab
				$( "#tabs" ).tabs( "enable", 1 );
				$( "#tabs" ).tabs( "select", 1 );
			}, 
			
			function() {
				// Display an unhappy dialog box with the link to register
				$( "#dialog_apikey" ).dialog( "open" );
			}, undefined, undefined, this 
		);
	});
	
	$( "#dialog_apikey" ).dialog({
		autoOpen: false,
		show: "blind",
		hide: "explode"
	});
	
	$( "#button_backup").button().click(function() {
		chrome.tabs.create({
			url: "chrome://bookmarks/#1",
			active: true
		});
		$("#button_continue").button("enable");
		$( "#tabs" ).tabs( "enable", 2 );
		$( "#tabs" ).tabs( "enable", 3 );
		$.totalStorage("bookmarksorter_backup", true);
	});
	
	$( "#button_continue").button().click(function() {
		$( "#tabs" ).tabs( "select", 2 );
	});
	
	if ($.totalStorage("bookmarksorter_backup") === null) {
		$("#button_continue").button("disable");
	}
	
	$( "#spinner_archivedays" ).spinner({
		min: 1,
		stop: function( event, ui ) {	
			// Set the archive days
			var value = $( "#spinner_archivedays" ).spinner( "value");
			SmartBookmarkSorter.setOldBookmarkDays(value);
		}
	});

	var oldBookmarkDays = SmartBookmarkSorter.getOldBookmarkDays();
	
	$( "#spinner_archivedays" ).spinner( "value", oldBookmarkDays);
	
	$( "#button_sample").button().click(function() {
		// Sort a sample of bookmarks
		SmartBookmarkSorter.sortSample();
	});
	
	$( "#button_sort").button().click(function() {
		// Open a dialog box
		$( "#dialog_confirm_sort" ).dialog( "open" );

	});
	
    $( "#dialog_confirm_sort" ).dialog({
		resizable: false,
		height:140,
		modal: true,
		autoOpen: false,
		show: "blind",
		hide: "explode",
		buttons: {
			"Sort all bookmarks": function() {
				SmartBookmarkSorter.sortOtherBookmarks(null);
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
    });
	
	// Get autosort settings

	
	$ ("#button_oncreate").button().click(function() {
		var isChecked = $( "#button_oncreate" ).is(':checked');
		if(isChecked) {
			// Set the on create flag to true
			setAutoOnCreate(true);
		}
		else {
			// Set the on create flag to false
			setAutoOnCreate(false);
		}
	});
	
	$ ("#button_interval").button().click(function() {
		var isChecked = $( "#button_interval" ).is(':checked');
		if(isChecked) {
			// Set the on interval sort flag to true
			SmartBookmarkSorter.setAutoInterval(true);
		}
		else {
			// Set the on interval sort flag to false
			SmartBookmarkSorter.setAutoInterval(false);
		}
	});
	
	$ ("#button_prioritize").button().click(function() {
		var isChecked = $( "#button_prioritize" ).is(':checked');
		if(isChecked) {
			// Set the on create flag to true
			SmartBookmarkSorter.setAutoPrioritize(true);
		}
		else {
			// Set the on create flag to false
			SmartBookmarkSorter.setAutoPrioritize(false);
		}
	});
	
	// Restore states for autosort buttons
	var isOnCreate = SmartBookmarkSorter.getAutoOnCreate();
	var isOnInterval = SmartBookmarkSorter.getAutoInterval();
	var isPrioritize = SmartBookmarkSorter.getAutoPrioritize();
	if(isOnCreate) {
		$("#button_oncreate").attr("checked","checked");
		$("#button_oncreate").button("refresh");
	}
	if(isOnInterval) {
		$("#button_interval").attr("checked","checked");
		$("#button_interval").button("refresh");
	}
	if(isPrioritize) {
		$("#button_prioritize").attr("checked","checked");
		$("#button_prioritize").button("refresh");
	}
	
	$ ("#button_autosort").button().click(function() {
		var isChecked = $( "#button_autosort" ).is(':checked');
		if(isChecked) {
			// Enable automatic sort
			console.log("Background page = ", background_page);
			SmartBookmarkSorter.enableAutomaticSort();
		}
		else {
			// Disable automatic sort
			SmartBookmarkSorter.disableAutomaticSort();
		}
	});
	
	if(isOnCreate || isOnInterval || isPrioritize) {
		$("#button_autosort").attr("checked","checked");
		$("#button_autosort").button("refresh");	
	}

});