define(["jquery", "sortapi", "storage", "autosort", "alchemy", "sharedbrowser", "lib/underscore.string", "jquery-ui.min",
    "lib/jquery.mjs.nestedSortable", "lib/jquery.total-storage", "lib/jquery.hotkeys", ], function ($, sortapi, storage, autosort, alchemy, shared, s) {
    $(document).tooltip();

    $("#tabs").tabs({heightStyle: "content", hide: 'fade', show: 'fade'});

    var bookmarks = shared.nestedList();

    // Disable text selection on the nested list
    bookmarks.disableSelection();

    // Fill the bookmarks tree
    shared.populateBookmarks();

    // Disable sorting and dragging
    bookmarks.sortable({
        disabled: true
    });

    // Get api key from local storage
    var key = storage.getApiKey();

    // Attach signal handlers to browser API
    shared.attachOnCreatedHandlers();
    shared.attachOnMovedHandlers();
    shared.attachOnRemovedHandlers();

    if (key === null || key === undefined) {
        $('#tabs').tabs('disable', 1); // disable second tab
        $('#tabs').tabs('disable', 2); // disable third tab
        $('#tabs').tabs('disable', 3); // disable fourth tab
    }
    else {
        $('#tabs').tabs('disable', 0); // disable first tab
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

                $('#tabs').tabs('disable', 0); // disable first tab

                // Unlock and go to the next tab
                $("#tabs").tabs("enable", 1).tabs("option", "active", 1);

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

    $("#progressbar_sorting").progressbar({
        value: 0
    });

    var selectMenu = $("#id_folders").selectmenu(),
        rootBookmarks = shared.rootBookmarks();

    rootBookmarks.forEach(function(value) {
        $('<option/>', {
            text: value
        }).appendTo(selectMenu);
    });

    $("#id_folders-button").tooltip({
            items: "span",
            content: 'Select the output folder for sorted results. All results will be placed in a folder called Archives.',
            position: { at: "bottom center" }
    });

    selectMenu.selectmenu( "refresh" );

    $("#button_sample").button().click(function () {
        // Check if a sort is in progress
        if (!storage.getIsOnManualSorting()) {
            // Sort a sample of bookmarks
            //sortapi.sortSample();

            var rootIndex = shared.selectedIndexModifier(selectMenu.prop("selectedIndex"));
            shared.cullTree("2113", 5).always(function() {
                console.log("Done culling");
            });

        }
        else {
            console.log("!!!!Sort is in progress");
        }
    });

    $("#button_sort").button().click(function () {
        // Open a dialog box
        $("#dialog_confirm_sort").dialog("open");
    });

    $("#button_settings").button({
        icons: {
            primary: "ui-icon-gear",
            secondary: "ui-icon-triangle-1-s"
        },
        text: false
    }).click(function() {
        $("#dialog_manual_settings").dialog("open");
    });

    $("#autocomplete_archives").autocomplete({
        change: function(event) {
            var selectedObj = $(event.target)[0],
                text = selectedObj.value,
                sanitized = s.escapeHTML(s.trim(text));

            if(!s.isBlank(sanitized)) {
                storage.setArchivesName(sanitized);
            }
            return false;
        },
        source: []
    }).val(storage.getArchivesName());

    $( "#spinner_settings_taxonomylevels" ).spinner({
        min: 1,
        max: 5,
        stop: function () {
            var value = $(this).spinner("value");
            storage.setMaxTaxonomyLevels(value);
        }
    }).spinner( "value", storage.getMaxTaxonomyLevels() );

    $( "#spinner_cull_num" ).spinner({
        min: 1,
        stop: function () {
            var value = $(this).spinner("value");
            storage.setCullNumber(value);
        }
    }).spinner( "value", storage.getCullNumber() );

    $( "#check_cull" ).button().on("change", function() {
        if($(this).is(":checked")) {
            storage.setIsOnCullBookmarks(true);
        } else {
            storage.setIsOnCullBookmarks(false);
        }
    }).prop('checked', storage.getIsOnCullBookmarks()).button("refresh");

    $( "#radio_sortAction" ).buttonset();

    $('#radio_create').on("change", function(){
        storage.setSortAction(true);
    });
    $('#radio_move').on("change", function(){
        storage.setSortAction(false);
    });

    if(storage.getSortAction())
    {
        $('#radio_create').prop("checked", true);
    }
    else
    {
        $('#radio_move').prop("checked", true);
    }

    $( "#radio_sortAction" ).buttonset('refresh');

    $("#dialog_manual_settings").dialog({
        height: 300,
        width: 400,
        resizable: false,
        draggable: false,
        autoOpen: false
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
                if (true || !storage.getIsOnManualSorting()) {
                    // Sort selected bookmarks
                    var selectedBookmarks = shared.selectedBookmarks(bookmarks);

                    // Output directory
                    var rootIndex = shared.selectedIndexModifier(selectMenu.prop("selectedIndex")),
                        archivesFolder = storage.getArchivesName(),
                        sortAction = storage.getSortAction(),
                        maxLevels = storage.getMaxTaxonomyLevels(),
                        cull = storage.getIsOnCullBookmarks();

                    var options = {archivesFolder: archivesFolder, sortAction: sortAction, maxLevels: maxLevels, cull:cull};

                    // Lock
                    $("#lock_icon").toggleClass("fa-unlock", false);
                    $("#lock_icon").toggleClass("fa-lock", true);
                    $("#lock_icon").attr('title',"Sorting operations are in progress. Please wait until they are complete to perform another operation.");

                    // Initialize progress
                    $("#progressbar_sorting").progressbar("option", "value", 0);
                    $("#progressbar_sorting").progressbar("option", "max", selectedBookmarks.length);

                    // Sort selected bookmarks via promise
                    var promise = sortapi.sortBookmarksEx(selectedBookmarks, rootIndex, options).always(function() {
                        // Unlock
                        $("#lock_icon").toggleClass("fa-lock", false);
                        $("#lock_icon").toggleClass("fa-unlock", true);
                        $("#lock_icon").attr('title',"No sorting operations are in progress; actions may be taken.");

                    }).progress(function(index) {
                        // Update progress bar
                        $("#progressbar_sorting").progressbar("option", "value", index);
                    });
                }
                else {
                    // Sort is in progress
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

    $("#button_cull").button().click(function () {
        var isChecked = $("#button_cull").is(':checked');
        if (isChecked) {
            // Set the on create flag to true
            storage.setAutoOnCreate(true);
        }
        else {
            // Set the on create flag to false
            storage.setAutoOnCreate(false);
        }
    });

    // Restore states for autosort buttons
    var isOnCreate = storage.getAutoOnCreate(),
        isOnInterval = storage.getAutoInterval(),
        isPrioritize = storage.getAutoPrioritize(),
        isAutoSort = storage.getAutoOn();


    if (isOnInterval) {
        $("#button_interval").attr("checked", "checked");
        $("#button_interval").button("refresh");
    }
    if (isPrioritize) {
        $("#button_prioritize").attr("checked", "checked");
        $("#button_prioritize").button("refresh");
    }
    if (isOnCreate) {
        $("#button_cull").attr("checked", "checked");
        $("#button_cull").button("refresh");
    }

    $("#button_autosort").button().click(function () {
        var isChecked = $("#button_autosort").is(':checked'),
            sort = $("#button_interval").is(':checked'),
            prioritize = $("#button_prioritize").is(':checked'),
            cull = $("#button_cull").is(':checked');

        if (isChecked) {
            // Enable automatic sort
            shared.getBackgroundService().done(function(background) {
                background.AutoSort.enableAutomaticSort(sort, prioritize, cull);
                storage.setAutoOn(true);
            });
        }
        else {
            // Disable automatic sort
            //autosort.disableAutomaticSort();
            storage.setAutoOn(false);
        }
    });

    if (isAutoSort) {
        $("#button_autosort").attr("checked", "checked");
        $("#button_autosort").button("refresh");
    }

    return {}
});
