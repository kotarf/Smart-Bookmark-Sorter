define(["jquery", "jquery-ui", "jquery.total-storage", "domReady"], function($) {

    var background_page = chrome.extension.getBackgroundPage(),
        SmartBookmarkSorter = background_page.require("sortapi");


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
		$( "#tabs" ).tabs({active: 2});
	}

	$( "#dialog_confirm_privacy" ).dialog({
		resizable: false,
		height:300,
		width:400,
		modal: true,
		autoOpen: false,
		show: "blind",
		hide: "explode",
		buttons: {
			"Accept AlchemyAPI's Privacy Policy": function() {
				// Save the state and the key
				SmartBookmarkSorter.setApiKey(key);
				
				$('#tabs').tabs('disable', 0); // disable first tab
				
				// Unlock and go to the next tab
				$( "#tabs" ).tabs( "enable", 1 );
				$( "#tabs" ).tabs( "load", 1 );
				
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});
	
	$( "#autocomplete_apikey" ).autocomplete({
		source: []
	});
	
	$( "#button_key").button().click(function() {
		key =  $("#autocomplete_apikey").val();
		// Test the API key to see if it is valid
		SmartBookmarkSorter.alchemyKeyTest( key,
			function() { 
				// Bring up a confirmation box noting privacy
				$( "#dialog_confirm_privacy" ).dialog( "open" );
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
		$( "#tabs" ).tabs({active: 2})
	});

	if ($.totalStorage('bookmarksorter_backup') === null) {
		$("#button_continue").button("disable");
	}
	
	$( "#spinner_archivedays" ).spinner({
		min: 0,
		stop: function( event, ui ) {	
			// Set the archive days
			var value = $( "#spinner_archivedays" ).spinner( "value");
			SmartBookmarkSorter.setOldBookmarkDays(value);
		}
	});

	var oldBookmarkDays = SmartBookmarkSorter.getOldBookmarkDays();
	
	$( "#spinner_archivedays" ).spinner( "value", oldBookmarkDays);
	
	$( "#progressbar_sorting" ).progressbar({
		value: 0
	});
	
	$( "#button_sample").button().click(function() {

		// Check if a sort is in progress
		if(!SmartBookmarkSorter.getIsOnManualSorting()) {
			// Sort a sample of bookmarks
			SmartBookmarkSorter.sortSample();
		}
        else{
            console.log("!!!!Sort is in progress");
        }
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
				// Check if a sort is in progress
				if(!SmartBookmarkSorter.getIsOnManualSorting()) {
					// Sort all bookmarks
					SmartBookmarkSorter.sortAllBookmarks();
				}
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
			SmartBookmarkSorter.setAutoOnCreate(true);
		}
		else {
			// Set the on create flag to false
			SmartBookmarkSorter.setAutoOnCreate(false);
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
	var isOnCreate = SmartBookmarkSorter.getAutoOnCreate(),
		isOnInterval = SmartBookmarkSorter.getAutoInterval(),
		isPrioritize = SmartBookmarkSorter.getAutoPrioritize(),
		isAutoSort = SmartBookmarkSorter.getAutoOn();
		
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
			SmartBookmarkSorter.enableAutomaticSort();
			SmartBookmarkSorter.setAutoOn(true);
		}
		else {
			// Disable automatic sort
			SmartBookmarkSorter.disableAutomaticSort();
			SmartBookmarkSorter.setAutoOn(false);
		}
	});
	
	if(isAutoSort) {
		$("#button_autosort").attr("checked","checked");
		$("#button_autosort").button("refresh");
	} 
	
	// Add listeners for error messages and progress messages
	chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
		var messageSplit = message.split(",");
		var messageCode = messageSplit[0];
		if(messageCode === SmartBookmarkSorter.config.dailyLimitError) {
			// Display an error dialog
			$( "#dialog_error_sort" ).dialog( "open" );			
		}
		else if(messageCode === SmartBookmarkSorter.config.sortBeginMsg) {
			var numSorts = parseInt(messageSplit[1]);

			$( "#progressbar_sorting" ).progressbar( "option", "value", 0);		
			$( "#progressbar_sorting" ).progressbar( "option", "max", numSorts );			
		}
		else if(messageCode === SmartBookmarkSorter.config.sortSuccessfulMsg) {
			var indexSort = parseInt(messageSplit[1]);

			// getter
			var value = $( "#progressbar_sorting").progressbar( "option", "value" );
			 
			// setter
			$( "#progressbar_sorting" ).progressbar( "option", "value", indexSort );		
		}
		else if(messageCode === SmartBookmarkSorter.config.sortCompleteMsg) {
			// getter
			var value = $( "#progressbar_sorting").progressbar( "option", "value" );
			 
			// setter
			$( "#progressbar_sorting" ).progressbar( "option", "value", value + 1 );
		}
	});

    return {}
});
