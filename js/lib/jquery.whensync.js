// Define a sandbox in which the whenSync() plugin can be defined.
(function( $ ){


	// Define the whenSync() jQuery plugin. This plugin is designed
	// to take N-number of callbacks. Each callback will be invoked
	// in order, given a Deferred object as its first invocation
	// argument.
	//
	// callback( Deferred [, result1, result2, resultN] );
	//
	// Additionally, all previous results will be passed as arguments
	// 2-N of the callback. Subsequent callbacks will not be invoked
	// until the Deferred object is resolved.
	$.whenSync = function( /* callbacks */ ){

		// Create a master deferred object for the entire validation
		// process. This will be rejected if ANY of the callback
		// Deferred objects is rejected. It will be resolved only
		// after ALL of the callback Deferreds are resolved.
		var masterDeferred = $.Deferred();

		// Create an array to hold the master results. As each
		// callback is invoked, we are going to pass-through the
		// aggregate of all the previous results.
		var masterResults = [];

		// Create a true array of callback functions (so that we
		// can make use of the core Array functions).
		var callbacks = Array.prototype.slice.call( arguments );


		// Check to make sure there is at least one callback. If there
		// are none, then just return a resolved Deferred.
		if (!callbacks.length){

			// Nothing more to do - resolve the master result.
			masterDeferred.resolve()

			// Return the promise of the result.
			return( masterDeferred.promise() );

		}


		// I provide a recursive means to invoke each callback.
		// I take the given callback to invoke. This callback will be
		// invoked with the previously resolved master Results.
		var invokeCallback = function( callback ){

			// Create a deferred result for this particular callback.
			var deferred = $.Deferred();

			// Create a promise for our deferred object so that we
			// can properly bind to the resolve / reject handlers
			// for the synchronous callback step.
			deferred.promise().then(
				function( /* Resolve arguments. */ ){

					// Take the current results and add them to the
					// end of the master results.
					masterResults = masterResults.concat(
						Array.prototype.slice.call( arguments )
					);

					// This callback was resolved. Now, let's see if
					// we have another callback to execute.
					var nextCallback = callbacks.shift();

					// Check for a next callback.
					if (nextCallback){

						// Recusively invoke the callback.
						return( invokeCallback( nextCallback ) );

					}

					// No more callbacks are available - our chain of
					// callbacks is complete. We can therefore
					// consider the entire chain to be resolved. As
					// such, we can resulve the master deferred.
					masterDeferred.resolve.apply(
						masterDeferred,
						masterResults
					);

				},
				function( /* Reject arguments */ ){

					// This callback was rejected. We cannot proceed
					// with any more steps in callback chain - we must
					// reject the master deferred.

					// Reject the master deferred and pass-through the
					// rejected results.
					masterDeferred.reject.apply(
						masterDeferred,
						arguments
					);

				}
			);

			// While the callback is intended to be asynchronous,
			// let's catch any synchronous errors that happen in the
			// immediate execution space.
			try {

				// Create an invocation arguments collection so that
				// we can seamlessly pass-through any previously-
				// resolved result. The Deferred result will always
				// be the first argument in this argument collection.
				var callbackArguments = [ deferred ].concat( masterResults );

				// Call the callback with the given arguments (the
				// Deferred result and any previous results).
				callback.apply( window, callbackArguments );

			} catch( syncError ){

				// If there was a synchronous error in the callback
				// that was not caught, let's return the native error.
				masterDeferred.reject( syncError );

			}

		};
		/* END: invokeCallback(){ .. } */


		// Invoke the first callback.
		invokeCallback( callbacks.shift() );

		// Return the promise of the master deferred object.
		return( masterDeferred.promise() );

	};


})( jQuery );
// End jQuery plugin.