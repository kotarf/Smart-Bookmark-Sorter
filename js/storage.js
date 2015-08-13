/**
 * Created by kotarf on 8/25/14.
 */
define(['jqueryhelpers', 'config'], function(jhelpers, config) {
    return {
        /**
         * Sets the api key in local storage
         * @param {string} apikey The apikey to set
         * @config {string} [apiStorageKey] Local storage key for api key
         */
        setApiKey: function (apikey) {
            jhelpers.jQueryStorageSetValue(config.apiStorageKey, apikey);
        },

        /**
         * Gets the api key in local storage
         * @config {string} [apiStorageKey] Local storage key for api key
         * @returns {string}
         */
        getApiKey: function () {
            return jhelpers.jQueryStorageGetValue(config.apiStorageKey);
        },

        /**
         * Sets auto create on
         * @param {bool} value The boolean to set
         * @config {string} [autoSortCreateKey] Local storage key auto create on
         */
        setAutoOnCreate: function (value) {
            jhelpers.jQueryStorageSetValue(config.autoSortCreateKey, value);
        },

        /**
         * Gets the api key in local storage
         * @config {string} [autoSortCreateKey] Local storage key for api key
         * @returns {bool}
         */
        getAutoOnCreate: function () {
            return jhelpers.jQueryStorageGetValue(config.autoSortCreateKey);
        },

        /**
         * Sets the auto interval  in local storage
         * @config {string} [autoSortTimedKey] Local storage key for timed sort
         * @param {bool} value The boolean to set
         */
        setAutoInterval: function (value) {
            jhelpers.jQueryStorageSetValue(config.autoSortTimedKey, value);
        },

        /**
         * Get the auto interval in local storage
         * @config {string} [autoSortTimedKey] Local storage key for timed sort
         * @returns {bool}
         */
        getAutoInterval: function () {
            return jhelpers.jQueryStorageGetValue(config.autoSortTimedKey);
        },

        /**
         * Sets the auto prioritize  in local storage
         * @config {string} [autoSortPriorityKey] Local storage key for priority sort
         * @param {bool} value The boolean to set
         */
        setAutoPrioritize: function (value) {
            jhelpers.jQueryStorageSetValue(config.autoSortPriorityKey, value);
        },

        /**
         * Get the auto interval in local storage
         * @config {string} [autoSortPriorityKey] Local storage key for priority sort
         * @returns {bool}
         */
        getAutoPrioritize: function () {
            return jhelpers.jQueryStorageGetValue(config.autoSortPriorityKey);
        },

        /**
         * Sets the auto sort in local storage
         * @config {string} [autoSortActiveKey] Local storage key for auto sort on
         * @param {bool} value The boolean to set
         */
        setAutoOn: function (value) {
            jhelpers.jQueryStorageSetValue(config.autoSortActiveKey, value);
        },

        /**
         * Gets the auto sort in local storage
         * @config {string} [autoSortActiveKey] Local storage key for auto sort on
         * @returns {bool}
         */
        getAutoOn: function () {
            return jhelpers.jQueryStorageGetValue(config.autoSortActiveKey);
        },

        /**
         * Set the old bookmark days in local storage
         * @config {string} [oldBookmarkDaysKey] Local storage key for old bookmark days
         * @param {int} value The int to set
         */
        setOldBookmarkDays: function (value) {
            jhelpers.jQueryStorageSetValue(config.oldBookmarkDaysKey, value);
        },

        /**
         * Get the old bookmark days in local storage
         * @config {string} [autoSortPriorityKey] Local storage key for old bookmark days
         * @config {string} [oldBookmarkDaysDefault] Default old bookmark days
         * @returns {int}
         */
        getOldBookmarkDays: function () {
            var oldBookmarkDays = jhelpers.jQueryStorageGetValue(config.oldBookmarkDaysKey);

            return oldBookmarkDays === null ? config.oldBookmarkDaysDefault : oldBookmarkDays;
        },

        /**
         * Set the sorting in progress  in local storage
         * @config {string} [isSortingKey] Sorting in progress key
         * @param {int} value The int to set
         */
        setIsSorting: function (value) {
            jhelpers.jQueryStorageSetValue(config.isSortingKey, value);
        },

        /**
         * Get the sorting in progress from storage
         * @config {string} [isSortingKey] Sorting in progress key
         * @returns {boolean}
         */
        getIsSorting: function () {
            var me = this,
                manualSorting = me.getIsOnManualSorting(),
                createSorting = me.getIsOnCreateSorting(),
                alarmSorting = me.getIsOnAlarmSorting(),
                isSorting = manualSorting || createSorting || alarmSorting;

            return isSorting;

        },

        /**
         * Set the sorting in progress for the manual sorting in local storage
         * @config {string} [isOnManualSortingKey] Sorting in progress key
         * @param {int} value The int to set
         */
        setIsOnManualSorting: function (value) {
            jhelpers.jQueryStorageSetValue(config.isOnManualSortingKey, value);
        },

        /**
         * Get the sorting in progress from storage
         * @config {string} [isOnManualSortingKey] Sorting in progress key
         * @returns {boolean}
         */
        getIsOnManualSorting: function () {
            return jhelpers.jQueryStorageGetValue(config.isOnManualSortingKey) || false;

        },

        /**
         * Set the sorting in progress for the on created listener in local storage
         * @config {string} [isOnCreateSortingKey] Sorting in progress key
         * @param {int} value The int to set
         */
        setIsOnCreateSorting: function (value) {
            jhelpers.jQueryStorageSetValue(config.isOnCreateSortingKey, value);
        },

        /**
         * Get the sorting for the on created listener in progress from storage
         * @config {string} [isOnCreateSortingKey] Sorting in progress key
         * @returns {boolean}
         */
        getIsOnCreateSorting: function () {
            return jhelpers.jQueryStorageGetValue(config.isOnCreateSortingKey) || false;

        },

        /**
         * Set the sorting in progress  in local storage
         * @config {string} [isOnIntervalSortingKey] Sorting in progress key
         * @param {int} value The int to set
         */
        setIsOnAlarmSorting: function (value) {
            jhelpers.jQueryStorageSetValue(config.isOnIntervalSortingKey, value);
        },

        /**
         * Get the sorting in progress from storage
         * @config {string} [isOnIntervalSortingKey] Sorting in progress key
         * @returns {boolean}
         */
        getIsOnAlarmSorting: function () {
            return jhelpers.jQueryStorageGetValue(config.isOnIntervalSortingKey) || false;

        },

        /**
         * Set the maximum number of folders to create when using taxonomy
         * @config {string} [maxTaxonomyFoldersKey]
         * @param {int} value
         */
        setMaxTaxonomyLevels: function (value) {
            jhelpers.jQueryStorageSetValue(config.maxTaxonomyFoldersKey, value);
        },

        /**
         * Get the maximum number of folders to create when using taxonomy
         * @config {string} [maxTaxonomyFoldersKey]
         * @config {string} [defaultTaxonomyLevels]
         * @returns {int}
         */
        getMaxTaxonomyLevels: function () {
            var taxonomyLevels = jhelpers.jQueryStorageGetValue(config.maxTaxonomyFoldersKey);

            return taxonomyLevels === null ? config.defaultTaxonomyLevels : taxonomyLevels;
        },


        setIsOnCullBookmarks: function (value) {
            jhelpers.jQueryStorageSetValue(config.isOnCullBookmarks, value);
        },


        getIsOnCullBookmarks: function () {
            return jhelpers.jQueryStorageGetValue(config.isOnCullBookmarks) || false;
        },

        setCullNumber: function (value) {
            jhelpers.jQueryStorageSetValue(config.cullNumber, value);
        },

        getCullNumber: function () {
            var cullLevels = jhelpers.jQueryStorageGetValue(config.cullNumber);

            return cullLevels === null ? config.defaultCullNumber : cullLevels;
        },

        setSortAction: function (value) {
            jhelpers.jQueryStorageSetValue(config.sortAction, value);
        },

        getSortAction: function () {
            return jhelpers.jQueryStorageGetValue(config.sortAction);
        },

        getArchivesName: function() {
            return jhelpers.jQueryStorageGetValue(config.archivesName) || config.archivesFolder;
        },

        setArchivesName: function(value) {
            jhelpers.jQueryStorageSetValue(config.archivesName, value);
        },

        setAutosortCounter: function(value) {
            jhelpers.jQueryStorageSetValue(config.indexCounter, value);
        },

        getAutosortCounter: function() {
            return jhelpers.jQueryStorageGetValue(config.indexCounter);
        }
    };
});