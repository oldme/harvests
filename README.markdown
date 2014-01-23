SwarmHarvest is an attempt to solve the ugliness of the asynchronous callbacks without forcing you to use promises.

 Promises look like a good idea but they were met with some (pasive) resistance. In node.js, promises have multiple implementations, many implementations looks too bloated,complex, etc.
 I personally prefer to not use any promise or flow control library because they all failed my internal beauty tests and I looked for a better alternative.
 
 We can maintain our simple API, asynchronous functions without promises bloat and I will show you how it can be done.

 The main idea is to create an environment where you continue to call asynchronous functions as usual.
 The only thing that changes is the syntax of calling those functions. You call those functions in a Harvest context that magically detects dependencies, make calls,etc.

## Simple Example:

    // we assume 2 functions (asynchronous APIs). 
    
        loadPenguin(id, success, error)
        loadPenguinFamily(father, mother, success, error)
     
     //The only conventions is that success(returnedResult) will be called by these APIs when they succeed


    // now, let's see how we load some Penguins
        var harvest = require("asyn-harvest").create();

         harvest.load('@father', loadPenguin, 'MrPenguin');
         harvest.load('@mother', loadPenguin, 'MrsPenguin');
         harvest.load('@family', loadPenguinFamily, '@father', '@mother');

         harvest.onSuccess(function(harvest){
            console.log("All those 3 requests are completed and in harvest.family we got thouse cute children");
            }
         });

         harvest.onError(function(harvest){
                      console.log("Well, move those penguins to the South Pole...");
         });
    //for a complete exemplification, look in test/penguin.js



##    Very simple API:

###create a new harvest context

      var harvest = require("asyn-harvest").create(contextBinding);
      contextBinding is an optional argument, and it is a function that can create an wrapper for all callbacks and handlers. Useful in the context of a multi tenancy and multi user systems
        (as example, look at createSwarmCallBack in swarmESB adapters)


###load() a variable in context; 

    //variableName is a string that begins with an @
    harvest.load(variableName, functionApi, ... )

### loadAt() - load in an array at a position 

        harvest.loadAt(arrayName, index,  functionApi, ... )

### do()

    // execute an function, the result of the functionApi is not useful, it is called as soon as all their free variables are ready
    //do don't change the success or fail status for a harvest
    harvest.do(functionApi, ... )

### you got third party APIS, prefer other calling conventions?

     //create or reuse your own convention for getting results from the asynchronous function
     //The only convention is that conventionFunction is a function that knows how to call the callback
     harvest.loadWithConvention(variableName, conventionFunction, callback )
     harvest.loadAtWithConvention(variableName, conventionFunction, callback )

### onSuccess()

    //instruct what to do in case of success 
    //handler is callback will be called with the context as parameter
     harvest.onSuccess(handler)

### onFailure()

    //instruct the context what to do in case of a fail
    harvest.onFail(handler)  //handler is callback that will be called with an error object (the error cause)


### finished() 

    //test the status anytime ( in a timeout for example, etc)
    harvest.finished() : will return -1 if error, 0 if not finished (still working or waiting), 1 for success

### stop the harvest by force...

    //clean memory, call onFailure handler, prevent other calls to be made outside etc
    //After calling the success or fail handlers , the harvest is automatically stopped if the handlers were not overwritten
     harvest.stop()



