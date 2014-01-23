
/*
    asynch-harvest
 */

/*
  default call conventions is that the function takes as the last 2 parameters 2 functions, one for reporting success and result and one for reporting errors
 */

defaultHarvestCallConvention = function(harvest, callBack, args, variable, position){
    var success = function(result){
        harvest.__callResult(result,variable, position);
    }

    var fail = function(error){
        harvest.__callError(error);
    }

    args.push(success);
    args.push(fail);

    try{
        var result = callBack.apply(null, args);
    }   catch(err){
        fail(err);
    }
}

function SwarmHarvest(contextBinder){
    var self = this;
    function mkArgs(myArguments, from){
        if(!from){
            from = 0;
        }

        if(myArguments.length <= from){
            return null;
        }
        var args = [];
        for(var i = from; i<myArguments.length;i++){
            args.push(myArguments[i]);
        }
        return args;
    }


    var internalSuccessHandler;
    this.onSuccess = function(handler){
        if(contextBinder){
            internalSuccessHandler = contextBinder(handler);
        } else {
            internalSuccessHandler = handler;
        }
    }

    var internalFailHandler;
    this.onFail = function(handler){
        if(contextBinder){
            internalFailHandler = contextBinder(handler);
        } else {
            internalFailHandler = handler;
        }
    }

    var internalFinishStatus = 0;
    //return -1 if error, 0 if continue, 1 for success
    this.finished = function(){
        return internalFinishStatus;
    }

    //

    //public for the sake of custom conventions
    this.__callError = function(error){
        internalFinishStatus = -1;
        if(internalFailHandler){
            internalFailHandler( error );
        }
    }

    var pendingCalls = [];
    function PendingCall(callConvention, variable, position, callBack, args, freeVariables){
        this.bindFreeVariable = function(variable){
            var index = freeVariables.indexOf(variable,0);
            if(index != -1){
                freeVariables.splice(index,1);
            } else {
                self.__callError(new Error("Harvesting error, multiple results for the same variable"));
            }

            if(freeVariables.length == 0 && internalFinishStatus == 0 ){
                callConvention(self, callBack, args, variable, position);
            }
        }

        this.call = function(){
            if(freeVariables.length == 0 && internalFinishStatus == 0 ){
                callConvention(self, callBack, args, variable, position);
            }
        }
    }

    var __freeVariables = {};
    function addPendingCallToFreeVariable(name, pendingCall){
        var fv = __freeVariables[name];
        if(!fv){
            fv = [];
            __freeVariables[name] = fv;
        }
        fv.push(pendingCall);
    }


    //public for the sake of custom conventions
    this.__callResult = function(result, variable, position){
        if(variable){
            if(position){
                this[variable][position] = result;
            } else {
                this[variable] = result;
            }

            var fv = __freeVariables[variable];
            if(fv){
                for(var i = 0; i < fv.length; i++){
                    fv[i].bindFreeVariable(variable);
                }
            }
        }
    }


    //clean internal references
    this.stop = function(){
        internalFinishStatus = -2; //stopped from outside, prevent any call except onFail
        if(internalFailHandler){
            internalFailHandler( new Error("Harvest stopped from outside"));
        }
    }


    function bindContext(calback){
        var apiFunction;
        if(contextBinder){
            apiFunction = contextBinder(callback);
        } else {
            apiFunction = callback;
        }
        return apiFunction;
    }

    function detectFreeVars(args){
        var result = [];
        for(var i = 0; i< args.length; i++){
            var v = args[i];
            if(typeof v == "string"){
                var ch = v.charAt(0)
                if(ch == "@"){
                    result.push(v.substring(1));
                }
            }
        }
        return result;
    }


    function createPendingCall(variableName, index, apiFunction , args){
        var freeVars = detectFreeVars(args);
        var pending = new PendingCall(defaultHarvestCallConvention, variableName, index, apiFunction, args, freeVars);

        if(freeVars.length != 0){
            for(var i = 0; i < freeVars.length; i++ ){
                addPendingCallToFreeVariable(freeVars[i], pending);
            }
        } else {
            pending.call();
        }
    }

    this.load = function(variableName, callback ){
        var args = mkArgs(arguments, 2);
        var apiFunction = bindContext(callback);
        createPendingCall(variableName, undefined, apiFunction , args);
    }

    this.do = function(callback ){
        var args = mkArgs(arguments, 1);
        var apiFunction = bindContext(callback);
        createPendingCall(undefined, undefined, apiFunction , args);
    }

    this.loadAt = function(arrayName, index,  callback ){
        var args = mkArgs(arguments, 3);
        var apiFunction = bindContext(callback);
        createPendingCall(arrayName, index, apiFunction , args);
    }

    this.loadWithConvention = function(variableName, convention, api ){
        //to be implemented. convention is a method that knows how to call the API function
        var args = mkArgs(arguments, 3);
        throw "Not implemented yet";
    }
}


exports.create = function(contextBinder){
    return new SwarmHarvest(contextBinder);
}


