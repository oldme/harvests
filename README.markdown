SwarmHarvest is an attempt to sort out the ugliness of the asynchronous callbacks without promises or control flow libraries.
Harvest doesn't attempt to resolve all imaginable cases involving asynchronous code but based on my experience it cover all the real cases found in real projects.

 Promises look like a good idea but they were met with an obvious (but passive) resistance. In node.js, promises have multiple implementations but many implementations looks too bloated,complex, etc.
 I personally prefer to not use any promise or flow control library because they all failed my internal beauty tests and I always hoped for a better alternative.

 An harvest handles in a very simple way the dependencies calls.
 The main idea is to create an environment where you continue to call asynchronous functions as usual.
 The only thing that changes is the syntax of calling those functions. You call those functions in a Harvest context that magically detects dependencies, make calls,etc.

## Simple Example:

    // as example, we assume 2 functions (asynchronous APIs for dealing with penguins)
    
        loadPenguin(nickName, successCallBack, errorCallBack)
        loadPenguinFamily(father, mother, successCallBack, errorCallBack)
     
     //the convention is that successCallBack(returnedResult) will be called by these APIs when they succeed and error


    // now, let's see how we load some Penguins
        var harvest = require("asyn-harvest").create();

         harvest.load('father', loadPenguin, 'MrPenguin');
         harvest.load('mother', loadPenguin, 'MrsPenguin');
         harvest.load('family', loadPenguinFamily, wait('father'), wait('mother'));

         harvest.onSuccess(function(harvest){
            console.log("All those 3 requests are completed and in harvest.family we got those cute penguin children");
            }
         });

         harvest.onError(function(harvest){
                      console.log("Well, move those penguins to the South Pole...");
         });
    //for a complete exemplification, look in test/penguin.js



##    Very simple API:

### create a new harvest context

      var harvest = require("asyn-harvest").create();

      create() can take 2 optional arguments: contextBindingCallBack and allowMonkeyTail
      contextBindingCallBack is a function that can create an wrapper for callbacks used during harvesting
      contextBindingCallBack  is useful in the context of a multi tenancy and multi user, shared systems
      As an example, look at createSwarmCallBack in swarmESB adapters
      allowMonkeyTail is to enable use of @ as a mark of free variables (if you prefer to not use wait).
      For security reasons, use of @ is disabled by default


###wait(variableName)

    wait(variableName) signals that a free variable needs to be computed before execution


###load() a variable in context; 

    harvest.load(variableName, functionApi, ... )

### loadAt() - load in an array in a context at a specified position

        harvest.loadAt(arrayName, index,  functionApi, ... )

### do()

    // execute an function, the result of the functionApi is not useful, it is called as soon as all their free variables are ready
    //don't change the success or fail status for a harvest
    harvest.do(functionApi, ... )

### Can use third party APIs, prefer other calling conventions?

     //You can create or reuse your own conventions for getting results from the asynchronous functions

     harvest.loadWithConvention(variableName, conventionFunction, callback)
     harvest.loadAtWithConvention(variableName, conventionFunction, callback)

     //conventionFunction is a function that knows how to call the callback
     // look in the harvest.js for how defaultHarvestCallConvention is implemented, other conventions can be easily created

### onSuccess()

    //instruct what to do in case of success 
    //handler is a callback that should be called when all the calls were made, returning the harvest as parameter

     harvest.onSuccess(handler)

### onFailure()

    //instruct the context what to do in case of a fail
    // an uncaught exception in any call or call of error functions can cause the failure of the harvest

    harvest.onFail(handler)  //handler is callback that will be called with an error object (the error cause)


### finished() 

    //you can get the status of the harvest anytime ( in a timeout for example, etc)

    harvest.finished()

     // it will return -1 it finished by error, 0 if not finished (still working or waiting callbacks), 1 for success

### stop the harvest by force...

    //clean memory, call onFailure handler, prevent other calls to be made outside etc
    //After calling the success or fail handlers, the harvest is automatically stopped if the handlers were not overwritten
     harvest.stop()




## ToDO
   //maybe add chains,eg.  wait('variable.field')
   //handle the case with multiple result calls that change the same object. I think promises don't handle this case, too, right? How usual is this case !?
   //create more conventions for standard node.js APIs, other common libraries (anybody want to help here?)
   //maybe create wrappers to accommodate with standard node.js APIs or other common libraries

