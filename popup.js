define([ "jquery", "sortapi", "storage", "autosort", "alchemy", "sharedbrowser", "lib/underscore.string", "config", "jquery-ui", "lib/jquery.mjs.nestedSortable", "lib/jquery.hotkeys" ], function ($, sortapi, storage, autosort, alchemy, shared, s, config) {
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

    $("#link_alchemy").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });

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

    var outputIndex = storage.getOutputIndex(),
        rootBookmarks = shared.rootBookmarks();

    var selectMenu = $("#id_folders").selectmenu({
            change: function(event, ui) {
                storage.setOutputIndex(ui.item.index);
            }
    });

    rootBookmarks.forEach(function(value) {
        $('<option/>', {
            text: value
        }).appendTo(selectMenu);
    });

    selectMenu.prop("selectedIndex",outputIndex).selectmenu('refresh');

    $('#id_folders-button').tooltip({
            items: "span",
            content: 'Select the output folder for sorted results.',
            position: { at: "bottom center" }
    });

    $("#button_sample").button().click(function () {
        // Check if a sort is in progress
        if (!storage.getIsOnManualSorting()) {
            // Sort a sample of bookmarks
            var rootIndex = shared.selectedIndexModifier(config.otherBookmarksIndex),
                archivesFolder = storage.getArchivesName(),
                sortAction = false,
                maxLevels = config.defaultTaxonomyLevels,
                cull = false;

            var options = {archivesFolder: archivesFolder, sortAction: sortAction, maxLevels: maxLevels, cull:cull};

            var lastThreeBookmarks = shared.lastNBookmarks(bookmarks, 3);

            if(_.isEmpty(lastThreeBookmarks)) {
                $("<div>No available bookmarks! Please add some bookmarks before attempting to sort.</div>").dialog({
                    title: "No available bookmarks",
                    modal: true,
                    draggable: false
                });
            }
            else {
                sortapi.sortBookmarksEx(lastThreeBookmarks, rootIndex, options);
            }
        }
        else {
            $("<div>A sort is already in progress! Please wait for it to complete.</div>").dialog({
                title: "Sort already in progress",
                modal: true,
                draggable: false
            });
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
    }).prop('checked', storage.getIsOnCullBookmarks());

    $( "#radio_sortAction" ).buttonset();

    $('#radio_create').on("change", function(){
        storage.setSortAction(false);
    });
    $('#radio_move').on("change", function(){
        storage.setSortAction(true);
    });

    if(storage.getSortAction())
    {
        $('#radio_move').prop("checked", true);
    }
    else
    {
        $('#radio_create').prop("checked", true);
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
                if (!storage.getIsOnManualSorting()) {
                    // Sort selected bookmarks
                    var selectedBookmarks = shared.selectedBookmarks(bookmarks);

                    if(_.isEmpty(selectedBookmarks)) {
                        $(this).dialog("close");
                        $("<div>No bookmarks selected! Please select bookmarks in the tree below before attempting to sort.</div>").dialog({
                            title: "No bookmarks selected",
                            modal: true,
                            draggable: false
                        });
                        return;
                    }

                    // Output directory
                    var rootIndex = shared.selectedIndexModifier(storage.getOutputIndex()),
                        archivesFolder = storage.getArchivesName(),
                        sortAction = storage.getSortAction(),
                        maxLevels = storage.getMaxTaxonomyLevels(),
                        cull = storage.getIsOnCullBookmarks(),
                        cullThreshold = storage.getCullNumber();

                    var options = {archivesFolder: archivesFolder, sortAction: sortAction, maxLevels: maxLevels, cull:cull, cullThreshold: cullThreshold};

                    // Lock
                    $("#lock_icon").toggleClass("fa-unlock", false);
                    $("#lock_icon").toggleClass("fa-lock", true);
                    $("#lock_icon").attr('title',"Sorting operations are in progress. Please wait until they are complete to perform another operation.");
                    $('#button_sort').button('disable');
                    $('#button_sample').button('disable');
                    $('#button_settings').button('disable');

                    // Initialize progress
                    $("#progressbar_sorting").progressbar("option", "value", 0);
                    $("#progressbar_sorting").progressbar("option", "max", selectedBookmarks.length);

                    // Sort selected bookmarks via promise
                    var promise = sortapi.sortBookmarksEx(selectedBookmarks, rootIndex, options).always(function() {
                        // Unlock
                        $("#lock_icon").toggleClass("fa-lock", false);
                        $("#lock_icon").toggleClass("fa-unlock", true);
                        $("#lock_icon").attr('title',"No sorting operations are in progress; actions may be taken.");
                        $('#button_sort').button('enable');
                        $('#button_sample').button('enable');
                        $('#button_settings').button('enable');

                    }).progress(function(index, id) {
                        // Update progress bar
                        $("#progressbar_sorting").progressbar("option", "value", index);
                    }).fail(function() {
                        /// TODO fix this to be specific
                        $("<div>Error during sorting. API key may be at max use for the day, or internet connection / firewall may have caused requests to fail.</div>").dialog({
                            title: "Error during sorting",
                            modal: true,
                            draggable: false
                        });
                    });
                }
                else {
                    // Sort is in progress
                    $("<div>A sort is already in progress! Please wait for it to complete.</div>").dialog({
                        title: "Sort already in progress",
                        modal: true,
                        draggable: false
                    });
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
        storage.setAutoInterval(isChecked);
    });

    $("#button_prioritize").button().click(function () {
        var isChecked = $("#button_prioritize").is(':checked');
        storage.setAutoPrioritize(isChecked);
    });

    $("#dialog_auto_settings").dialog({
        width: 400,
        height: "auto",
        resizable: true,
        draggable: false,
        autoOpen: false,
    });

    $("#button_settings_autosort").button({
        icons: {
            primary: "ui-icon-gear",
            secondary: "ui-icon-triangle-1-s"
        },
        text: false
    }).click(function() {
        $("#dialog_auto_settings").dialog("open");
    });

    $("#dialog_auto_settings").css({height:"350px", overflowy:"auto"});

    $( "#tabs_autosort_settings" ).tabs({heightStyle: "content"});

    // Restore states for autosort buttons
    var isOnInterval = storage.getAutoInterval(),
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

    $("#button_autosort").button().click(function () {
        var isChecked = $("#button_autosort").is(':checked'),
            sort = $("#button_interval").is(':checked'),
            prioritize = $("#button_prioritize").is(':checked');

        var background = shared.getBackgroundService().promise();

        if (isChecked) {
            // Enable automatic sort
            background.done(function(background) {
                background.AutoSort.enableAutomaticSort(sort, prioritize);
                storage.setAutoOn(true);
            });

            // Disable all related options
            $("#button_prioritize").button("disable");
            $("#button_interval").button("disable");
            $("#button_settings_autosort").button("disable");
        }
        else {
            // Disable automatic sort
            background.done(function(background) {
                background.AutoSort.disableAutomaticSort();
                storage.setAutoOn(false);
            });

            // Enable all related options
            $("#button_prioritize").button("enable");
            $("#button_interval").button("enable");
            $("#button_settings_autosort").button("enable");
        }
    });

    if (isAutoSort) {
        $("#button_autosort").attr("checked", "checked");
        $("#button_autosort").button("refresh");

        // Disable all related options
        $("#button_prioritize").button("disable");
        $("#button_interval").button("disable");
        $("#button_settings_autosort").button("disable");
    }

    var autosort_other = storage.getAutosortOtherBookmarks(),
        autosort_bar = storage.getAutosortBookmarksBar(),
        autosort_mobile = storage.getAutosortMobileBookmarks();

    $('#button_autosort_other').button().click(function() {
        var isChecked = $("#button_autosort_other").is(':checked');
        storage.setAutosortOtherBookmarks(isChecked);
    });

    $('#button_autosort_bar').button().click(function() {
        var isChecked = $("#button_autosort_bar").is(':checked');
        storage.setAutosortBookmarksBar(isChecked);
    });

    $('#button_autosort_mobile').button().click(function() {
        var isChecked = $("#button_autosort_mobile").is(':checked');
        storage.setAutosortMobileBookmarks(isChecked);
    });

    if (autosort_other) {
        $("#button_autosort_other").attr("checked", "checked");
    }
    if (autosort_bar) {
        $("#button_autosort_bar").attr("checked", "checked");
    }
    if (autosort_mobile) {
        $("#button_autosort_mobile").attr("checked", "checked");
    }

    $("#button_autosort_other").button("refresh");
    $("#button_autosort_bar").button("refresh");
    $("#button_autosort_mobile").button("refresh");

    var autosort_days = storage.getOldBookmarkDays();

    $( "#amount_days" ).val( autosort_days +" days" );

    $( "#slider_days" ).slider({
        min: 5,
        max: 365,
        step: 5,
        value: autosort_days,
        slide: function( event, ui ) {
            $( "#amount_days" ).val( ui.value +" days" );

            storage.setOldBookmarkDays(ui.value);
        }
    });

    $( "#spinner_intervaltime" ).spinner({
        stop: function () {
            var value = $(this).spinner("value");
            storage.setAutosortMinutes(value);
        },
        min: 5,
        max: 120
    }).spinner( "value", storage.getAutosortMinutes() );

    $("#button_autosort_action").button().click(function() {
        var isChecked = $(this).is(':checked');
        if(isChecked) {
            $(this).button( "option", "label", "Move" );

        } else {
            $(this).button( "option", "label", "Create" );
        }
        storage.setAutoSortAction(isChecked);
    });

    var autoSortAction = storage.getAutoSortAction();

    if(autoSortAction) {
        $("#button_autosort_action").prop('checked', true).button( "option", "label", "Move" ).button("refresh");
    }

    $( "#radio_priorityOutputDest" ).buttonset();

    var priorityDest = storage.getAutosortPrioritizeDirectory();

    if(priorityDest === 2) {
        $("#radio_priorityOther").prop('checked', true).button("refresh");
    }
    else if(priorityDest === 1) {
        $("#radio_priorityBar").prop('checked', true).button("refresh");
    } else {
        $("#radio_priorityMobile").prop('checked', true).button("refresh");
    }
    $( "#radio_priorityOutputDest" ).buttonset('refresh');

    $('#radio_priorityOther').button().click(function() {
        storage.setAutosortPrioritizeDirectory(2);
    });
    $('#radio_priorityBar').button().click(function() {
        storage.setAutosortPrioritizeDirectory(1);
    });
    $('#radio_priorityMobile').button().click(function() {
        storage.setAutosortPrioritizeDirectory(3);
    });

    $("#version").text(shared.getVersion());

    $("#link_jquery").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
    $("#link_jqueryui").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
    $("#link_alchemyapi").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
    $("#link_whensync").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
    $("#link_totalstorage").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
    $("#link_jqueryurlparser").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
    $("#link_minimal").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
    $("#link_booglemarks").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
    $("#link_supersorter").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
    $("#link_mygithub").click(function(e) {
        e.preventDefault();
        shared.openTab($(this).attr("href"));
    });
});
