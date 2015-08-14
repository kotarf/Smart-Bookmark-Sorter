/**
 * Created by kotarf on 8/14/2015.
 */
define(['underscore', 'jqueryhelpers', 'config'], function(_, jhelpers, config) {
    // Add new local storage variables here
    var tokens = [
        {name: 'ApiKey'},
        {name: 'AutoOnCreate'},
        {name: 'AutoInterval'},
        {name: 'AutoPrioritize'},
        {name: 'AutoOn'},
        {name: 'OldBookmarkDays', def: config.oldBookmarkDaysDefault},
        {name: 'IsOnManualSorting'},
        {name: 'IsOnCreateSorting'},
        {name: 'IsOnAlarmSorting'},
        {name: 'MaxTaxonomyLevels', def: config.defaultTaxonomyLevels},
        {name: 'IsOnCullBookmarks'},
        {name: 'CullNumber', def: config.defaultCullNumber},
        {name: 'SortAction'},
        {name: 'ArchivesName', def: config.archivesFolder},
        {name: 'AutosortCounter'},
    ];

    var getter = function(key, def) {
        return jhelpers.jQueryStorageGetValue(key) || def;
    }

    var setter = function(key, value) {
        jhelpers.jQueryStorageSetValue(key, value);
    }

    var module = {};

    _.each(tokens, function(element) {
        var name = element.name,
            def = element.def;

        // Generate getter
        var getfunct = _.partial(getter, name, def);

        // Generate setter
        var setfunct = _.partial(setter, name);

        // Set getter and setter on module
        module['get' + name] = getfunct;
        module['set' + name] = setfunct;
    });

    return module;
});