define(["jquery", "sortapi", "storage", "alchemy", "sharedbrowser", "jquery-ui.min",
    "lib/jquery.mjs.nestedSortable", "lib/jquery.total-storage", "lib/jquery.hotkeys"], function ($, sortapi, storage, alchemy, shared) {
    $(document).tooltip();

    $("#tabs").tabs({heightStyle: "content"});

    var bookmarks = shared.nestedList();

    // Disable text selection on the nested list
    bookmarks.disableSelection();

    // Fill the bookmarks tree
    shared.populateBookmarks();

    // Get api key from local storage
    var key = storage.getApiKey();

    if (key === null || key === undefined) {
        $('#tabs').tabs('disable', 1); // disable second tab
        $('#tabs').tabs('disable', 2); // disable third tab
        $('#tabs').tabs('disable', 3); // disable fourth tab
    }
    else {
        //$('#tabs').tabs('disable', 0); // disable first tab
        $("#tabs").tabs({active: 2});
    }

    $("#dialog_confirm_privacy").dialog({
        resizable: false,
        height: 300,
        width: 400,
        modal: true,
        autoOpen: false,
        show: "blind",
        hide: "explode",
        buttons: {
            "Accept AlchemyAPI's Privacy Policy": function () {
                // Save the state and the key
                storage.setApiKey(key);

                //$('#tabs').tabs('disable', 0); // disable first tab

                // Unlock and go to the next tab
                $("#tabs").tabs("enable", 1).tabs("option", "active", 1);
                ;

                $(this).dialog("close");
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });

    $("#autocomplete_apikey").autocomplete({
        source: []
    });

    $("#button_key").button().click(function () {
        key = $("#autocomplete_apikey").val();
        console.log("key is ", key);
        // Test the API key to see if it is valid
        var promise = alchemy.alchemyKeyTest(key);

        promise.done(function () {
            // Bring up a confirmation box noting privacy
            $("#dialog_confirm_privacy").dialog("open");
        });

        promise.fail(function () {
            $("#dialog_apikey").dialog("open");

        });
    });

    $("#dialog_apikey").dialog({
        autoOpen: false,
        show: "blind",
        hide: "explode"
    });

    $("#button_backup").button().click(function () {
        chrome.tabs.create({
            url: "chrome://bookmarks/#1",
            active: true
        });
        $("#button_continue").button("enable");
        $("#tabs").tabs("enable", 2);
        $("#tabs").tabs("enable", 3);
        $.totalStorage("bookmarksorter_backup", true);
    });

    $("#button_continue").button().click(function () {
        $("#tabs").tabs({active: 2})
    });

    if ($.totalStorage('bookmarksorter_backup') === null) {
        $("#button_continue").button("disable");
    }

    $("#spinner_archivedays").spinner({
        min: 0,
        stop: function (event, ui) {
            // Set the archive days
            var value = $("#spinner_archivedays").spinner("value");
            storage.setOldBookmarkDays(value);
        }
    });

    var oldBookmarkDays = storage.getOldBookmarkDays();

    $("#spinner_archivedays").spinner("value", oldBookmarkDays);

    $("#progressbar_sorting").progressbar({
        value: 0
    });

    $("#id_folders").selectmenu();

    $("#button_sample").button().click(function () {

        // Check if a sort is in progress
        if (!storage.getIsOnManualSorting()) {
            // Sort a sample of bookmarks
            sortapi.sortSample();
        }
        else {
            console.log("!!!!Sort is in progress");
        }
    });

    $("#button_sort").button().click(function () {
        // Open a dialog box
        $("#dialog_confirm_sort").dialog("open");

    });

    $("#dialog_confirm_sort").dialog({
        resizable: false,
        height: 140,
        modal: true,
        autoOpen: false,
        show: "blind",
        hide: "explode",
        buttons: {
            "Sort all bookmarks": function () {
                // Check if a sort is in progress
                if (!storage.getIsOnManualSorting()) {
                    // Sort all bookmarks
                    sortapi.sortAllBookmarks();
                }
                $(this).dialog("close");
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });

    $("#dialog_error_sort").dialog({
        resizable: false,
        height: 140,
        modal: true,
        autoOpen: false,
    });

    // Get autosort settings


    $("#button_oncreate").button().click(function () {
        var isChecked = $("#button_oncreate").is(':checked');
        if (isChecked) {
            // Set the on create flag to true
            storage.setAutoOnCreate(true);
        }
        else {
            // Set the on create flag to false
            storage.setAutoOnCreate(false);
        }
    });

    $("#button_interval").button().click(function () {
        var isChecked = $("#button_interval").is(':checked');
        if (isChecked) {
            // Set the on interval sort flag to true
            storage.setAutoInterval(true);
        }
        else {
            // Set the on interval sort flag to false
            storage.setAutoInterval(false);
        }
    });

    $("#button_prioritize").button().click(function () {
        var isChecked = $("#button_prioritize").is(':checked');
        if (isChecked) {
            // Set the on create flag to true
            storage.setAutoPrioritize(true);
        }
        else {
            // Set the on create flag to false
            storage.setAutoPrioritize(false);
        }
    });

    // Restore states for autosort buttons
    var isOnCreate = storage.getAutoOnCreate(),
        isOnInterval = storage.getAutoInterval(),
        isPrioritize = storage.getAutoPrioritize(),
        isAutoSort = storage.getAutoOn();

    if (isOnCreate) {
        $("#button_oncreate").attr("checked", "checked");
        $("#button_oncreate").button("refresh");
    }
    if (isOnInterval) {
        $("#button_interval").attr("checked", "checked");
        $("#button_interval").button("refresh");
    }
    if (isPrioritize) {
        $("#button_prioritize").attr("checked", "checked");
        $("#button_prioritize").button("refresh");
    }

    $("#button_autosort").button().click(function () {
        var isChecked = $("#button_autosort").is(':checked');
        if (isChecked) {
            // Enable automatic sort
            storage.enableAutomaticSort();
            storage.setAutoOn(true);
        }
        else {
            // Disable automatic sort
            storage.disableAutomaticSort();
            storage.setAutoOn(false);
        }
    });

    if (isAutoSort) {
        $("#button_autosort").attr("checked", "checked");
        $("#button_autosort").button("refresh");
    }

    // Add listeners for error messages and progress messages
    chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
        var messageSplit = message.split(",");
        var messageCode = messageSplit[0];
        if (messageCode === config.dailyLimitError) {
            // Display an error dialog
            $("#dialog_error_sort").dialog("open");
        }
        else if (messageCode === config.sortBeginMsg) {
            var numSorts = parseInt(messageSplit[1]);

            $("#progressbar_sorting").progressbar("option", "value", 0);
            $("#progressbar_sorting").progressbar("option", "max", numSorts);
        }
        else if (messageCode === config.sortSuccessfulMsg) {
            var indexSort = parseInt(messageSplit[1]);

            // getter
            var value = $("#progressbar_sorting").progressbar("option", "value");

            // setter
            $("#progressbar_sorting").progressbar("option", "value", indexSort);
        }
        else if (messageCode === config.sortCompleteMsg) {
            // getter
            var value = $("#progressbar_sorting").progressbar("option", "value");

            // setter
            $("#progressbar_sorting").progressbar("option", "value", value + 1);
        }
    });

    return {}
});
