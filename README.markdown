SwarmHarvest is an attempt to sort out the ugliness of the asynchronous callbacks without promises or control flow libraries.

### Warning, still fairly beta, barely passing some tests. I want your feedback!

An harvest handles the dependencies calls, you don't have to describe the flow. The main idea is to create an environment where you continue to use asynchronous functions as usual but with a syntax that resemble synchronous calls.

## Simple Example:

> For example, we have 2 functions (asynchronous APIs for dealing with penguins)
> The only convention is that successCallBack(returnedResult) will be called by these APIs on success and errorCallBack on fails

        loadPenguin(nickName, successCallBack, errorCallBack)
        loadPenguinFamily(father, mother, successCallBack, errorCallBack)

> now, let's see how we load some Penguins

         var harvest = require("harvests").create();

         harvest.load('father', loadPenguin, 'MrPenguin');
         harvest.load('mother', loadPenguin, 'MrsPenguin');
         harvest.load('family', loadPenguinFamily, wait('father'), wait('mother'));

         harvest.onSuccess(function(harvest){
            console.log("All those 3 requests are completed');
            console.log('In harvest.family we got those cute penguin children objects");
            }
         });

         harvest.onError(function(harvest){
                      console.log("Well, move those penguins to the South Pole...");
         });

> for a complete example, look in test/penguin.js

Promises look like a good idea but they were met with some resistance (passive resistance, get used only be some people, many prefer callbacks). In node.js, promises have multiple implementations but many implementations looks too bloated,complex, etc.
I personally prefer to not use any promise or flow control library because they all failed my internal beauty tests and I always hoped for a better alternative (as syntax, simplicity and intuitive behaviour).

Flow controls libraries, like 'async', looks interesting but a bit intimidating and with a learning curve (learning about cargo and other stuff is funny,not!).

Harvest idea is based on the insight that you are doing calls to return values, doing calls in parallel, series, whatever!  A harvest is doing stuff in parallel when is possible but ideally you don't have to think much about such things.

The syntax for calling asynchronous functions is fairly simple, use a function from the API (let,letAt, load, loadAt, xlet, xletAt) and remove callback arguments altogether.

Harvest doesn't attempt to resolve all imaginable cases involving asynchronous code but based on my experience it covers the real cases found in real projects. There remains little need for promises, new flow control and wired syntax.


##    Very simple API:

### create a new harvest context

      var harvest = require("harvests").create(contextBindingCallBack, allowMonkeyTail );

>>Note! The name is harvests not harvest
>create() can take 2 optional arguments: contextBindingCallBack and allowMonkeyTail.    contextBindingCallBack is a function that can create an wrapper for callbacks used during harvesting
> contextBindingCallBack  is useful in the context of a multi tenancy and multi user, shared systems. For an example, look at createSwarmCallBack in swarmESB adapters

> allowMonkeyTail is to enable use of @ as a mark of free variables (if you prefer to not use wait). For security reasons, use of @ is disabled by default


### wait(variableName)

    wait(variableName) signals that a free variable needs to be computed before execution


### load() a variable in context;

    harvest.load(variableName, functionApi, ... )

### loadAt() - load in an array in a context at a specified position

        harvest.loadAt(arrayName, index,  functionApi, ... )

### let() load a variable in harvest's context using node.js convention ( function(err,result) )

    harvest.let(variableName, functionApi, ... )

### letAt() - load in an array in a context at a specified position, use node.js convention

    harvest.letAt(arrayName, index,  functionApi, ... )


### do()

> 'do' execute the function as soon as all their free variables are ready. The callback result will not change the success or fail status for a harvest

    harvest.do(functionApi, ... )

### Can use third party APIs, prefer other calling conventions?

>You can create or reuse your own conventions for getting results from the asynchronous functions

     harvest.xlet(variableName, conventionFunction, callback)
     harvest.xletAt(variableName, conventionFunction, callback)

> conventionFunction is a function that knows how to call the callback. Please,look in the harvest.js for how defaultHarvestCallConvention is implemented, other conventions can be easily created

### onSuccess()

> Instruct the harvest what to do in case of success.   handler is a callback that should be called when all the calls were made, returning the harvest as parameter

     harvest.onSuccess(handler)

### onFail()

>instruct the context what to do in case of a fail. Aa uncaught exception in any call or call of error functions can cause the failure of the harvest

    harvest.onFail(handler)

>handler is a callback that will be called with an error object (the cause of error )


### finished() 

>you can get the status of the harvest anytime ( in a timeout for example, etc)

    harvest.finished()

>if will return -1 it finished by error, 0 if not finished (still working or waiting callbacks), 1 for success

### stop the harvest by force...

>Clean memory, call onFailure handler, prevent other calls to be made outside etc
>After calling the success or fail handlers, the harvest is automatically stopped if the handlers were not overwritten

     harvest.stop()


## ToDOs

> Create more call conventions for other common libraries (anybody want to help here?)

> Maybe: detect circular dependencies!?  Somebody needs it? Just ask!

> Maybe: add chains,eg.  wait('variable.field').

> Maybe: handle the case with multiple result calls that change the same object. I think promises don't handle this case well, too. How usual is this case !?

> It is easy and possible to implement lazy loading (load only when other value needs it)


