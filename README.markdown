SwarmHarvest is an attempt to solve the ugliness of the asynchronous callbacks without forcing you to use promises.

 Promises look like a good idea but they were met with some resistance from various people. In node.js, promises  have multiple implementations, many implementations looks too bloated,complex, etc.
 I personally prefer to not use any promise or flow control library because they all failed my internal beauty test and I looked for a better alternative.
 Seems that we can maintain our simple, asynchronous functions without promises bloat and I will show you how it can be done.

 The main idea is to create an environment where you continue to call asynchronous functions as usual.
 The only thing that changes is the syntax of calling those functions. You call those functions in a Harvest context that magically detects dependencies, make calls,etc.

  Simple Example:
    // we assume 2 functions (asynchronous APIs). The only conventions is that success(returnedResult) will be called by these APIs when they succeed
        loadPenguin(id,success, error)
        loadPenguinFamily(father,mother, success, error)

    // now, let's see how we load some Penguins
        var harvest = require("harvest").newHarvest();

         harvest.load('@father',loadPenguin, 'MrPenguin');
         harvest.load('@mother',loadPenguin, 'MrsPenguin');
         harvest.load('@family',loadPenguinFamily, '@father', '@mother');

         harvest.onSuccess(function(harvest){
            console.log("All those 3 request are completed and in harvest.family we got some children");
            }
         }

         harvest.onError = function(harvest){
                      console.log("Well, move those penguins to the South Pole...");
                   }

    Very simple API:

    //create an harvest context
      var harvest = require("harvest").newHarvest(contextBinding);
      contextBinding is an optional argument, and it is a function that can create an wrapper for all callbacks and handlers. Useful in the context of a multi tenancy and multi user systems
        (as example, look at createSwarmCallBack in swarmESB adapters)


     //load a variable in context; variableName is a string that begins with an @
        harvest.load(variableName, callback, ... )

    //load an array element in the harvesting context
        harvest.loadAt(arrayName,index,  callback, ... )

    //create or reuse your own convention for getting results from the asynchronous function
     //a convention is a function that knows how to call the callback
     harvest.loadWithConvention(variableName, conventionFunction, callback )
     harvest.loadAtWithConvention(variableName, conventionFunction, callback )

    //instruct the context what to do in case of a fail
     harvest.onFail(handler)  //handler is callback will be called with an error object (the error cause)

    //instruct what to do in case of success //handler is callback will be called with the context as parameter
     harvest.onSuccess(handler)

     //test anytime the status of the the harvest context (timeout, etc)
     harvest.finished() : will return -1 if error, 0 if not finished (still working or waiting), 1 for success

     //stop the harvest by force... clean memory. After calling the success or fail handlers , the harvest is automatically stopped if the handlers were not overwritten
     harvest.stop()






