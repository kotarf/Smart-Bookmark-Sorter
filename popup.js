$(function() {
	var background_page = chrome.extension.getBackgroundPage();
	
	$( document ).tooltip();
	
	$( "#tabs" ).tabs({ heightStyle: "content" });

	// Get api key from local storage
	var key = background_page.SmartBookmarkSorter.getApiKey();

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
		background_page.SmartBookmarkSorter.alchemyKeyTest( key, 
			function() { 
				// Save the state and the key
				background_page.SmartBookmarkSorter.setApiKey(key);
				
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
			background_page.SmartBookmarkSorter.setOldBookmarkDays(value);
		}
	});

	var oldBookmarkDays = background_page.SmartBookmarkSorter.getOldBookmarkDays();
	
	$( "#spinner_archivedays" ).spinner( "value", oldBookmarkDays);
	
	$( "#progressbar_sorting" ).progressbar({
		value: 0
	});
	
	$( "#button_sample").button().click(function() {
		// Sort a sample of bookmarks
		background_page.SmartBookmarkSorter.sortSample();
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
				background_page.SmartBookmarkSorter.sortAllBookmarks();
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
    });
	
    $( "#dialog_error_sort" ).dialog({
		resizable: false,
		height:140,
		modal: true,
		autoOpen: false,
    });
	
	// Get autosort settings

	
	$ ("#button_oncreate").button().click(function() {
		var isChecked = $( "#button_oncreate" ).is(':checked');
		if(isChecked) {
			// Set the on create flag to true
			background_page.SmartBookmarkSorter.setAutoOnCreate(true);
		}
		else {
			// Set the on create flag to false
			background_page.SmartBookmarkSorter.setAutoOnCreate(false);
		}
	});
	
	$ ("#button_interval").button().click(function() {
		var isChecked = $( "#button_interval" ).is(':checked');
		if(isChecked) {
			// Set the on interval sort flag to true
			background_page.SmartBookmarkSorter.setAutoInterval(true);
		}
		else {
			// Set the on interval sort flag to false
			background_page.SmartBookmarkSorter.setAutoInterval(false);
		}
	});
	
	$ ("#button_prioritize").button().click(function() {
		var isChecked = $( "#button_prioritize" ).is(':checked');
		if(isChecked) {
			// Set the on create flag to true
			background_page.SmartBookmarkSorter.setAutoPrioritize(true);
		}
		else {
			// Set the on create flag to false
			background_page.SmartBookmarkSorter.setAutoPrioritize(false);
		}
	});
	
	// Restore states for autosort buttons
	var isOnCreate = background_page.SmartBookmarkSorter.getAutoOnCreate();
	var isOnInterval = background_page.SmartBookmarkSorter.getAutoInterval();
	var isPrioritize = background_page.SmartBookmarkSorter.getAutoPrioritize();
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
			background_page.SmartBookmarkSorter.enableAutomaticSort();
		}
		else {
			// Disable automatic sort
			background_page.SmartBookmarkSorter.disableAutomaticSort();
		}
	});
	
	if(isOnCreate || isOnInterval || isPrioritize) {
		$("#button_autosort").attr("checked","checked");
		$("#button_autosort").button("refresh");	
	}
	
	// Add listeners for error messages and progress messages
	chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
		var messageSplit = message.split(",");
		var messageCode = messageSplit[0];
		if(messageCode === background_page.SmartBookmarkSorter.config.dailyLimitError) {
			// Display an error dialog
			$( "#dialog_error_sort" ).dialog( "open" );			
		}
		else if(messageCode === background_page.SmartBookmarkSorter.config.sortBeginMsg) {
			var numSorts = parseInt(messageSplit[1]);
			console.log("NUMSORTS = ", numSorts);
			$( "#progressbar_sorting" ).progressbar( "option", "value", 0);		
			$( "#progressbar_sorting" ).progressbar( "option", "max", numSorts );			
		}
		else if(messageCode === background_page.SmartBookmarkSorter.config.sortSuccessfulMsg) {
			var indexSort = parseInt(messageSplit[1]);

			// getter
			var value = $( "#progressbar_sorting").progressbar( "option", "value" );
			 
			// setter
			$( "#progressbar_sorting" ).progressbar( "option", "value", indexSort );		
		}
		else if(messageCode === background_page.SmartBookmarkSorter.config.sortCompleteMsg) {
			// getter
			var value = $( "#progressbar_sorting").progressbar( "option", "value" );
			 
			// setter
			$( "#progressbar_sorting" ).progressbar( "option", "value", value + 1 );
		}
	});
});