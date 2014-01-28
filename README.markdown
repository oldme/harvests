Harvests library is an attempt to sort out the ugliness of the asynchronous callbacks without promises or control flow libraries.

An harvest handles the dependencies calls, you don't have to describe the flow. The main idea is to create an environment where you continue to use asynchronous functions as usual but with a syntax that resemble synchronous calls.

## Simple Example:

> For example, we have 2 functions (asynchronous APIs for dealing with penguins)
> The only convention is that successCallBack(returnedResult) will be called by these APIs on success and errorCallBack on fails

        loadPenguin(nickName, callBack)
        loadPenguinFamily(father, mother, callBack)

> now, let's see how we load some Penguins

        var harvest = require("harvests").create();

        harvest.let('father', loadPenguin, 'MrPenguin');
        harvest.let('mother', loadPenguin, 'MrsPenguin');
        harvest.let('family', loadPenguinFamily, wait('father'), wait('mother'));

        harvest.do(function(family){
            console.log(family); //also in  harvest.father, harvest.mother, harvest.family you got values
        }, wait('family') );

        harvest.onFail(function(error, variable, index){
            console.log("Well, move those penguins to the South Pole...", error, variable, index);
        });

> for a full example with complex cases, look in test/penguin.js


The syntax for calling asynchronous functions is fairly simple, use a function from the API (let,letAt, load, loadAt, xlet, xletAt), add some wait calls where needed and remove callback arguments altogether.


##  Simple API:

### create() a new harvest context

      var harvest = require("harvests").create(contextBindingCallBack, preventStackOverflow);

>Note! The name of the module is 'harvests' not 'harvest'

> create() can take 2 optional arguments: contextBindingCallBack and preventStackOverflow.

>contextBindingCallBack is a function that can create an wrapper for callbacks used during harvesting. This is useful in the context of a multi tenancy and multi user systems. For an example, look at createSwarmCallBack in swarmESB adapters

> preventStackOverflow: force asynchronous returns even for synchronous callbacks returns, prevents growth of the stack


### wait(variableName)

    wait(variableName)

> wait is how you say that a variable should be computed before current calling current statement

### let()

> load a variable in harvest's context using node.js convention ( function(err,result) ). Similar with load but using node.js standard calling convention

    harvest.let(variableName, functionApi, ... )

### letAt()

 > load a value in an array or in an object ( member of the context at a specified position or specified name of the object), use node.js standard calling convention

    harvest.letAt(arrayName|objectName, index,  functionApi, ... )



### do()

> 'do' execute the function as soon as all their free variables are ready. The callback result will not change the success or fail status for a harvest. Waits until wait variables are fulfilled.

    harvest.do(functionApi, ... )

> do can be used instead of onSuccess to detect intermediate phases and to execute your code when becomes possible. The functionApi arguments will be the waiting parameters.

### set()

> 'set' executes an assignment but waits until wait variables are fulfilled

    harvest.set(name, value, ... )


### onSuccess()

> Instruct the harvest what to do in case of success.   handler is a callback that should be called when all the calls were made, returning the harvest as parameter

     harvest.onSuccess(handler)

### onFail()

>instruct the context what to do in case of a fail. Aa uncaught exception in any call or call of error functions can cause the failure of the harvest

    harvest.onFail(handler)

>handler is a callback that will be called with an error object (the cause of error ) , and with the name of the variable that could not be loaded


### finished()

>you can get the status of the harvest anytime ( in a timeout for example, etc)

    harvest.finished()

>if will return -1 it finished by error, 0 if not finished (still working or waiting callbacks), 1 for success

### stop the harvest by force...

>Clean memory, call onFailure handler, prevent other calls to be made outside etc
>After calling the success or fail handlers, the harvest is automatically stopped if the handlers were not overwritten

     harvest.stop()

### Can I use other third party API or like other calling conventions?

>You can create or reuse your own call conventions for getting results from the asynchronous functions. let and load functions provide support for the most common ones.

     harvest.xlet(variableName, conventionFunction, callback)
     harvest.xletAt(variableName, conventionFunction, callback)

> conventionFunction functions are easy to write. Please,look in the harvest.js for how defaultHarvestCallConvention is implemented


### load()  similar with let, different calling convention

> loads a variable in context with success, error callback convention;

    harvest.load(variableName, functionApi, ... )

> functionApi takes as last 2 parameters, 2 functions to report success and error

### loadAt()

> load in an array in a context at a specified position, using success, error callback convention;

        harvest.loadAt(arrayName|objectName, index,  functionApi, ... )


## What about promises, control flow libraries, etc?

Promises look like a good idea but they were met with some resistance (rather passive resistance, they are used only be some people, many prefer callbacks). In node.js, promises have multiple implementations but many implementations looks too bloated,complex, etc.
Form me promise and flow control libraries failed my internal beauty tests and I always hoped for a better alternative (as syntax, intuitive behaviour, zero learning curve).

Harvest idea is based on the insight that you are doing calls to return values. Doing calls in parallel, series, whatever, should not be your real concern!
A harvest is doing stuff in parallel when is possible but  you don't have to think about such things (except if you are going to do many, many requests,etc).

Harvests don't try to resolve all imaginable cases involving asynchronous code but it covers the usual cases found in real projects.
I would love to see the cases when you need promises, flow control libraries, etc.


## ToDOs

> Create more call conventions for other common libraries? What call conventions do you use?

> It is possible to implement lazy loading. A lazy let function could be implemented fairly easy .

> Maybe: detect circular dependencies!?  Somebody needs it? Just ask!

> Maybe: handle the case with multiple result calls that change the same object. I think promises have the same problem and a wrapper is required.

> Maybe: add chains,eg.  wait('variable.field').



