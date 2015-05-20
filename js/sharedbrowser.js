/**
 * Created by kotarf on 5/10/2015.
 */
define(['jquery', 'chromeinterface', 'config' , 'lib/Queue.src', 'lib/jquery.browser'], function($, chromex, cfg, libqueue) {
   return {
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

       bookmarksListDivs : function() {
            var tree = this.bookmarksTree();

           /// TODO convert api-specific bookmark trees into our own object
            var me = this;
           var promise = tree.then(function(results) {

               var queue = new Queue(),
                   root = results[0];

               // Traverse the bookmarks tree iteratively
               queue.enqueue(root);

               do {
                   var item = queue.dequeue();

                   // Do <div> processing //
                   var isFolder = item.url,
                       uri = isFolder? 'url(chrome://favicon/' + item.url + ')' : "url(chrome-extension://" + chrome.runtime.id + '/images/logo_16x16.png' + ')';

                   console.log(item.title, uri);

                   var bookmarkDiv = $('.sortable').append($('<li/>').
                           append($('<div/>', {
                               text : item.title,
                               css: {
                                   'background-image': uri,
                                   'background-repeat': 'no-repeat'
                               }
                           }))
                   );

                   if (item.children) {
                       _.each(item.children, function(element) {
                           queue.enqueue(element);
                       });
                   }

               } while(!queue.isEmpty())
           });

           return promise;


            /*
                 jQuery('<div/>', {
                 id: 'foo',
                 href: 'http://google.com',
                 title: 'Become a Googler',
                 rel: 'external',
                 text: 'Go to Google!'
                 }).appendTo('#mySelector');
             */
       },

       openTab : function(tab) {
         // Return a function to open a tab in a new window without losing extension focus
           // if chrome
           if ( $.browser.webkit ) {

           }

           // if firefox
           if ( $.browser.mozilla ) {

           }
       }

    }
});