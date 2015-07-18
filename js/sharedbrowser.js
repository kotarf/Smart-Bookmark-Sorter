/**
 * Created by kotarf on 5/10/2015.
 */
define(['jquery', 'chromeinterface', 'config', 'alchemy', 'config', 'jqueryhelpers', 'lib/Queue.src', 'lib/jquery.browser'], function($, chromex, cfg, alchemy, config, jhelpers, libqueue) {
   return {

       createFolderIfNotExists : function(title, parentId) {
           var dfd = $.Deferred(),
               me = this,
               parentId = parentId || 1;

           if($.browser.webkit) {
               chromex.findFolder(title).done(function(results) {
                   var folder =_.filter(results, function(element) {
                       return element.parentId == parentId;
                   })[0];
                   dfd.resolve(folder.id, parentId);
               }).fail(function() {
                   me.createFolder(title, parentId).done(function(result) {
                       dfd.resolve(result.id, parentId);
                   });
               });
           }

           return dfd.promise();
       },

       /**
        * Creates a folder by the category of the given URL, making an API request to get data and browser requests to find or create a folder
        * Makes an Alchemy API request to check the category
        * @param {string} url The url to lookup.
        * @param {string} parentId The parentId to create the folder in.
        */
       createFolderByCategory : function (url, parentId)
       {
           var dfd = $.Deferred(),
               me = this;

           alchemy.alchemyCategoryLookupEx(url).done(function(result, data) {
               me.createFolderIfNotExists(result, parentId).done(function(id, parentId) {
                   dfd.resolve(id, parentId);
               }).fail(function() {
                   dfd.fail(undefined, parentid, data);
               });
           }).fail(function(result, data) {
               dfd.fail(undefined, parentid, data);
           });

           return dfd.promise();
       },

       /**
        * Duplicates the folder structure of AlchemyAPI's returned taxonomy (only creating folders if they exist)
        * @param {string} url The url to lookup.
        * @param {string} parentId The parentId to create the first folder in
        */
       createFoldersByTaxonomy: function (url, parentId) {
           var me = this,
               dfd = $.Deferred();

           alchemy.alchemyTaxonomyLookupEx(url).done(function () {

               console.log("Alchemy taxonomy:", arguments);
               var results = arguments[0];
               console.log(results);
                   var bestResult = results[0][config.taxonomyNestedProperty] || results[0];
               console.log(bestResult);

               var splitResults = bestResult.split(config.taxonomyDelimiter);
               console.log(splitResults);

               var taxonomy = _.isEmpty(splitResults[0]) ? splitResults.splice(1) : splitResults.splice(0)
               console.log(taxonomy);

               var defFunctors = _.map(taxonomy, function (element) {
                   return function () {
                       var deferred = arguments[0],
                           title = element,
                           parentId = arguments.length > 1 ? arguments[arguments.length - 1] : parentId;

                       // Resolve the deferred in the future.
                        me.createFolderIfNotExists(title, parentId).done(function(newId) {
                            deferred.resolve(newId);
                        });

                   };
               });

               var asyncChain = jhelpers.jQueryWhenSync(me, defFunctors);

               asyncChain.done(function(results) {
                   console.log("Resolving ", arguments);
                   dfd.resolve(arguments);
               });

               asyncChain.fail(function(results) {
                   dfd.fail(results);
               });

               return asyncChain.promise();

           }).fail(function (result, data) {
               dfd.fail(result, data);
           });

           return dfd.promise();
       },

       searchFolder : function (title) {
           if($.browser.webkit)
           {
                return chromex.searchFolder(title).promise();
           }
       },

       /**
        * Create folder (even if it exists) with specified parentID with name, callback
        * @param {string} title The title of the folder.
        * @param {string} parentId The parentId to create the folder in.
        */
       createFolder : function (title, parentId) {
           var me = this;

           if($.browser.webkit)
           {
               var dfd = $.Deferred();

               var folder = {
                   title: title,
                   parentId: parentId.toString()
               };
               console.log("Folder", folder);

               // Create the folder
               chromex.createBookmark(folder).done(function (result) {
                   console.log("Folder created (chromex)", result);
                   dfd.resolve(result);
               });

               return dfd.promise();
           }
       },

        moveBookmark: function(id, destination) {
            var dfd = $.Deferred();


            if($.browser.webkit ) {
                console.log("Attempting to move ", id, " to ", destination);

                chromex.moveBookmark(id, destination).always(function(result) {
                    console.log("move result for chrome ", result);

                    dfd.resolve(result.id, result.parentId);
                });
            }

            return dfd.promise();
        },

        bookmarksSubTree: function(id) {
            var dfd = $.Deferred();

            // if chrome
            if ( $.browser.webkit ) {
                if(!id) {
                    id = cfg.rootBookmarksId;
                }

                return chromex.chromeGetSubTree(id).then();
            }

            // if firefox
            if ( $.browser.mozilla ) {
                if(!id) {

                }

                return null;
            }

            // null
        },

       bookmarksTree: function() {
           // if chrome
           if ( $.browser.webkit ) {
               return chromex.chromeGetTree().then();
           }

           // if firefox
           if ( $.browser.mozilla ) {
               return null;
           }
       },

       populateBookmarks : function(rootNode, parentId) {
            var rootNode = rootNode || $('.sortable'),
                tree = parentId ? this.bookmarksSubTree(parentId) : this.bookmarksTree();

           /// TODO convert api-specific bookmark trees into our own object
            var me = this;
           var promise = tree.then(function(results) {

               var queue = new Queue(),
                   root = results[0];

               // Discard the root of the bookmarks tree (chrome)
               for(var i = 0; i < root.children.length; ++i)
               {
                   var child = root.children[i];
                   queue.enqueue({child:child, parent:rootNode});
               }

               // Traverse the bookmarks tree iteratively via queue
               do {
                   var d = queue.dequeue(),
                       item = d.child,
                       parent = d.parent;

                   // Do <div> processing //
                   var isFolder = item.url === undefined ? true : false,
                       uri = !isFolder ? 'url(chrome://favicon/' + item.url + ')' : "url(chrome-extension://" + chrome.runtime.id + '/images/logo_16x16.png' + ')';

                   // If bookmark
                   if(!isFolder)
                   {
                       var li = $('<li/>').attr("id", item.id).append(
                           $('<div/>', {
                               text : item.title,
                               css: {
                                   'background-image': uri,
                                   'background-repeat': 'no-repeat'
                               }
                           })
                       );

                       parent.append(li);
                   }
                   // If folder
                   else{
                       // Please note: every <li> must have either one or two direct children,
                       // the first one being a container element (such as <div> in the above example), and the (optional) second one being the nested list.
                       var li = $('<li/>').attr({id: item.id, parentid: item.parentId, folder: true}).append($('<div/>', {
                           text: item.title,
                           css: {
                               'background-image': uri,
                               'background-repeat': 'no-repeat'
                           }
                       }).append($('<i/>', {
                           float: 'left'
                       }).addClass("fa fa-plus")));

                       var domItems = li.appendTo(parent);

                       // The default list type is <ol>.
                       var domNestedList = $('<ol/>').appendTo(domItems);

                       // If folder with children
                       if (item.children) {
                           _.each(item.children, function(element) {
                               queue.enqueue({child:element, parent:domNestedList});
                           });

                           // Start collapsed
                           li.addClass('mjs-nestedSortable-collapsed');
                       }
                   }
               } while(!queue.isEmpty())
           });

           return promise;
       },

       openTab : function(tab) {
         // Return a function to open a tab in a new window without losing extension focus
           // if chrome
           if ( $.browser.webkit ) {

           }

           // if firefox
           if ( $.browser.mozilla ) {

           }
       },

       nestedList : function() {

           // Initialize the bookmarks tree
           var bm = $('.sortable'),
               selectedElement;

           bm.nestedSortable({
               handle: 'div',
               items: 'li',
               toleranceElement: '> div',
               expandOnHover: 700,
               distance: 30,
               forcePlaceholderSize: true,
           });

           bm.previouslySelected = {};

           bm.on('click', 'div', function(e) {

               var target = $(e.target);
               parentli = target.closest('li');

               e.preventDefault();

               if(parentli.attr("folder") !== "true") {

                   // If no shift key is pressed
                   if (!(e.shiftKey) ) {
                       bm.previouslySelected = target;

                       // Highlight the element if it is not a folder
                       target.toggleClass('borderhighlight');
                   }
                   else
                   {
                       // Get the previously selected target (within the current folder), and highlight all elements up to and including it.
                       var previousParent = bm.previouslySelected.closest('li'),
                           selector = "#" + previousParent.attr("id"),
                           indexA = -1,
                           indexB = -1;

                       target.toggleClass('borderhighlight');

                       if(parentli.siblings(selector).length && previousParent) {
                           var ol = target.closest('ol');

                           // JQuery's index function with parameters does NOT work, as of 2.1.4
                           $.each(ol.children(), function (index, element) {
                               var element = $(element);

                               if (element.attr('id') === parentli.attr("id")) {
                                   indexA = index;
                               }
                               if (element.attr('id') === previousParent.attr("id")) {
                                   indexB = index;
                               }
                           });

                           if (indexA < indexB) {
                               selectedElements = parentli.nextUntil(selector, 'li');
                           } else {
                               selectedElements = parentli.prevUntil(selector, 'li');
                           }

                           // Highlight  up to the selected element, in the correct direction
                           selectedElements.each(function (index, element) {
                               $(element).children('div').each(function (index, element) {
                                   $(element).toggleClass("borderhighlight", true);
                               });
                           });
                       }
                   }
               }
               else {
                   // Highlight all descendants if it is a folder
                   var ol = parentli.children("ol"),
                       descendants = ol.find("div");

                   descendants.each(function(index, element) {
                       $(element).toggleClass("borderhighlight");
                   });
               }

               return false;
           });

           // Expand / collapse folders
           bm.on('click', 'li i', function(e) {
               $(this).closest('li').toggleClass('mjs-nestedSortable-collapsed').toggleClass('mjs-nestedSortable-expanded');
               $(this).toggleClass('fa fa-plus').toggleClass('fa fa-minus');
               return false;
           });

           // Select all
           $(document).bind('keydown', 'ctrl+a', function() {
               var descendants = $(".sortable div");

               if(descendants.length != 0) {
                   descendants.each(function(index, element) {
                       $(element).toggleClass("borderhighlight", true);
                   });
               }

               return false;
           });

           // Clear all
           $(document).bind('keydown', 'ctrl+space', function() {
               var descendants = $(".sortable div");

               if(descendants.length != 0) {
                   descendants.each(function(index, element) {
                       $(element).toggleClass("borderhighlight", false);
                   });
               }

               return false;
           });

           return bm;
       }
    }
});