
/*
    harvest: making asynchronous programming easy, every day!
 */

var init = function(){

    function SwarmHarvest(contextBinder, preventStackOverflow){
        var self = this;
        var internalFinishStatus = 0; // -1 error, 0 working, 1 succes
        var internalSuccessHandler;
        var internalFailHandler;
        var waitingCounter = 1; // prevent declaring success too fast
        var errors = {};

        process.nextTick(newAnswer); //may be it got loaded entirely synchronously


        /*
         the default call convention is that a function takes 2 functions for the last 2 parameters, one for reporting success and a result and one for reporting errors
         */

        function success_errorHarvestCallConvention(harvest, callBack, args, variable, position){
            var success = function(result){
                harvest.__callResult(result,variable, position);
            };

            var fail = function(error){
                harvest.__callResultError(error, variable, position );
            };

            args.push(success);
            args.push(fail);

            var callFunct =  function(){
                try{
                    callBack.apply(null, args);
                } catch(err){
                    //console.log("Error in ", callBack, variable, position, err, err.stack);
                    harvest.__callError(err, variable, position);
                }
            }

            if(preventStackOverflow){
                process.nextTick(callFunct);
            } else {
                callFunct();
            }
        }

        /*
         nidejs call convention is the calbak returns err, result
         */

        function nodejsHarvestCallConvention(harvest, callBack, args, variable, position){

            var retCallback = function(error, result){
                if(error != undefined){
                    harvest.__callResultError(error, variable, position );
                    //harvest.__callError(error, variable, position);
                } else {

                    harvest.__callResult(result,variable, position);
                }
            };

            args.push(retCallback);

            var callFunct =  function(){
                try{
                    callBack.apply(null, args);
                } catch(err){
                    //console.log("Error in ", callBack, variable, position, err, err.stack);
                    harvest.__callError(err, variable, position);
                }
            }

            if(preventStackOverflow){
                process.nextTick(callFunct);
            } else {
                callFunct();
            }
        }

        function synchHarvestCallConvention(harvest, callBack, args, variable, position){
            var callFunct =  function(){
                try {
                    var result = callBack.apply(null, args);
                    harvest.__callResult(result, variable, position);
                } catch(err){
                    //console.log("Error in ", callBack, variable, position, err, err.stack);
                    harvest.__callError(err, variable, position);
                }
            }

            if(preventStackOverflow){
                process.nextTick(callFunct);
            } else {
                callFunct();
            }
        }

        this.onSuccess = function(handler){
            internalFinishStatus = 0;
            if(contextBinder){
                internalSuccessHandler = contextBinder(handler);
            } else {
                internalSuccessHandler = handler;
            }
        };

        this.onFail = function(handler){
            internalFinishStatus = 0;
            if(contextBinder){
                internalFailHandler = contextBinder(handler);
            } else {
                internalFailHandler = handler;
            }
        };

        this.onError = this.onFail;


        //return -1 if error, 0 if continue, 1 for success
        this.finished = function(){
            return internalFinishStatus;
        };

        //public for the sake of custom conventions
        this.__callError = function(error , memberName, index){
            internalFinishStatus = -1;
            if(internalFailHandler){
                internalFailHandler( error, memberName, index );
            } else {
                console.log("Untreated fail. Add onFail call to your harvest!");
            }
        };


        //public for the sake of custom conventions
        this.__callResultError = function(error, memberName, index){
            this.__callResult(null,memberName, index );
            saveError(error , memberName, index);
        };

        function saveError(error, variable, index){
            var verr = errors[variable];
            if(verr){
                if(verr instanceof Array){
                    verr.push(error);
                } else {
                    errors[variable] = [verr, error]
                }
            } else {
                    errors[variable] = error;
            }
        }

        this.getErrors = function(variable){
            return errors[variable];
        }

        //public for the sake of custom conventions
        this.__callResult = function(result, variable, position){
            var fv = getVariableByName(variable);

            if(internalFinishStatus == 0){
                if(variable){
                    if(position != undefined){
                        if(this[variable] == undefined){
                            this[variable] = [];
                        }
                        if(position == -1){
                            this[variable].push(result);
                        } else {
                            this[variable][position] = result;
                        }
                    } else {
                        this[variable] = result;
                    }

                    fv.setValue(variable, position, result);
                }

            } else {
                if(internalFinishStatus == 1 ){
                    console.log("Possible harvest error, result calls encountered after archiving success. Dumping debug info:", result, variable, position);
                }
                //else ignore these calls.. nothing else we can do for a better world..
            }

            newAnswer();
        };


        var __freeVariables = {};
        function getVariable(xvar){
            var ret;
            if( xvar instanceof HarvestWaitingVariable){
                ret = __freeVariables[xvar.name()];
                if(!ret){
                    __freeVariables[xvar.name()] = xvar;
                    ret = xvar;
                }
            }
            return ret;
        }

        function getVariableByName(name){
            var ret = __freeVariables[name];
            if(!ret){
                ret = new HarvestWaitingVariable(name);
                __freeVariables[name] = ret;
            }
            return ret;
        }


        function addPendingCallToFreeVariable(freeVariable, pendingCall){
            getVariable(freeVariable).addPendingCall(pendingCall);
        }



        //clean internal references
        this.stop = function(){
            __freeVariables = {};
            internalFinishStatus = -2; //stopped from outside, prevent any call except onFail
            if(internalFailHandler){
                internalFailHandler( new Error("Harvest stopped from outside"));
            }
        };

        function bindContext(callBack){
            var apiFunction;
            if(contextBinder){
                apiFunction = contextBinder(callBack);
            } else {
                apiFunction = callBack;
            }
            return apiFunction;
        }

        function detectFreeVars(args){
            var result = {indexes:[], strings:[], variables:[]};
            for(var i = 0; i< args.length; i++){
                var v = getVariable(args[i]);
                if(v){ //is instance of HarvestWaitingVariable
                        if(v.hasValue()){
                            args[i] = v.value();
                        } else {
                            result.strings.push(v.name());
                            result.indexes.push(i);
                            result.variables.push(v);
                        }
                    }
                }
            return result;
        }

        function createPendingCall(variableName, index, apiFunction , args, convention){
            if(variableName){
                getVariableByName(variableName).callWaiting(index);
            }

            var freeVars = detectFreeVars(args);
            var pending = new PendingCall(convention, variableName, index, apiFunction, args, freeVars);

            newWait();

            if(freeVars.strings.length != 0){
                for(var i = 0; i < freeVars.strings.length; i++ ){
                    addPendingCallToFreeVariable(freeVars.variables[i], pending);
                }
            } else {
                pending.call();
            }
        }

        this.do = function(callback ){
            var args = mkArgs(arguments, 1);
            var apiFunction = bindContext(callback);
            createPendingCall(undefined, undefined, apiFunction , args, synchHarvestCallConvention);
        };

        this.xdo = function(callback , convention){
            var args = mkArgs(arguments, 1);
            var apiFunction = bindContext(callback);
            createPendingCall(undefined, undefined, apiFunction, args, convention);
        };

        this.set = function(variableName, value ){
            var args = mkArgs(arguments, 2);
            createPendingCall(variableName, undefined, function(){
                    self[variableName] = value;
                    return value;
                },
                args, synchHarvestCallConvention);
        };

        this.load = function(variableName, callback ){
            var args = mkArgs(arguments, 2);
            var apiFunction = bindContext(callback);
            createPendingCall(variableName, undefined, apiFunction , args, success_errorHarvestCallConvention);
        };

        this.loadAt = function(arrayName, index,  callback ){
            var args = mkArgs(arguments, 3);
            var apiFunction = bindContext(callback);
            createPendingCall(arrayName, index, apiFunction , args, success_errorHarvestCallConvention);
        };

        this.let = function(variableName, callback ){
            var args = mkArgs(arguments, 2);
            var apiFunction = bindContext(callback);
            createPendingCall(variableName, undefined, apiFunction , args, nodejsHarvestCallConvention);
        };

        this.letAt = function(arrayName, index,  callback ){
            var args = mkArgs(arguments, 3);
            var apiFunction = bindContext(callback);
            createPendingCall(arrayName, index, apiFunction , args, nodejsHarvestCallConvention);
        };

        this.pack = function(arrayName,  callback ){
            var args = mkArgs(arguments, 2);
            var apiFunction = bindContext(callback);
            createPendingCall(arrayName, -1, apiFunction , args, nodejsHarvestCallConvention);
        };

        this.xlet = function(variableName, convention, apiFunction ){
            //to be implemented. convention is a method that knows how to call the API function
            var args = mkArgs(arguments, 3);
            createPendingCall(variableName, undefined, apiFunction , args, convention);
        };

        this.xletAt = function(arrayName,index, convention, apiFunction ){
            //to be implemented. convention is a method that knows how to call the API function
            var args = mkArgs(arguments, 4);
            createPendingCall(arrayName, index, apiFunction ,args, convention);

        };

        //block success
        function newWait(){
            waitingCounter++;
        }

        //test for success
        function newAnswer(){
            waitingCounter--;
            if(waitingCounter == 0 && internalFinishStatus == 0){
                internalFinishStatus = 1;
                if(internalSuccessHandler){
                    waitingCounter++;        //prevent declaring success too fast in loads started in succes handlers
                    var oldSuccess = internalSuccessHandler;
                    internalSuccessHandler = undefined; //prevent calling again if new loads are requested and onSuccess is not redefined
                    oldSuccess(self);
                    process.nextTick(newAnswer); // clean waitingCounter, for reuse, etc
                }
            }
        }

        // inside function because use self,waitingCounter
        function PendingCall(callConvention, variable, position, callBack, args, freeVariables){
            this.index = position;
            this.debugName =  variable;

            if(internalFinishStatus >0){
                internalFinishStatus = 0; //reset it anyway
            }
            var consumableList = freeVariables.strings.slice(0);

            this.bindFreeVariable = function(otherVariable){


                var index = consumableList.indexOf(otherVariable,0);
                if(index != -1){
                    consumableList.splice(index,1);
                } else {
                    self.__callError(new Error("Harvesting error, multiple results for the same variable, coming from " + otherVariable),variable, position);
                }

                if(consumableList.length == 0 && internalFinishStatus == 0 ){
                    this.call();
                }
            };

            this.call = function(){
                if(consumableList.length == 0){
                    for(var j=0;j<freeVariables.indexes.length;j++){
                        args[freeVariables.indexes[j]] = self[freeVariables.strings[j]];
                    }
                    callConvention(self, callBack, args, variable, position);
                }
            };

        }
    }

    function HarvestWaitingVariable(name){
        var waitingList = [];
        this.debugName =  name;

        this.name = function(){
            return name;
        };

        var membersWaitCounter = 0;

        this.callWaiting = function(index){
            if(index != undefined){
                membersWaitCounter++;
            }
        }

        this.addPendingCall = function(pc){
            waitingList.push(pc);
        };

        var __value = this;

        this.setValue = function(variable, position, value){
            __value = value;

            if(position != undefined){
                process.nextTick(function(){   //this breaks the stacktrace... but at least is a sound implementation...
                    if(position != undefined){
                        membersWaitCounter--;
                        if(membersWaitCounter > 0){
                            return ;
                        }
                    }
                    //bind all dependencies that are waiting
                    for(var i = 0; i < waitingList.length; i++){
                        waitingList[i].bindFreeVariable(variable);
                    }
                });
            } else {
                //bind all dependencies that are waiting
                for(var i = 0; i < waitingList.length; i++){
                    waitingList[i].bindFreeVariable(variable);
                }
            }
        };

        this.value = function(){
            return __value == this? undefined : __value;
        };

        this.hasValue = function(){
            return __value != this && membersWaitCounter == 0;
        };
    }

    SwarmHarvest.prototype.wait = function(name){
        return new HarvestWaitingVariable(name);
    };

    //trying to not pollute the global space, as this library should be used in many projects. Define your own wait function if wait is taken
    if (typeof wait != 'undefined') {
        console.log("Warning: refusing to overwrite 'wait' for use with harvests library. 'wait' is already defined!?. Rename your 'wait', or make an alias for SwarmHarvest.prototype.wait ");
    } else {
        wait = SwarmHarvest.prototype.wait;
    }

    // not belonging here,I reuse this function in other projects, but...
    function mkArgs(myArguments, from){
        if(!from){
            from = 0;
        }

        if(myArguments.length <= from){
            return [];
        }
        var args = [];
        for(var i = from; i<myArguments.length;i++){
            args.push(myArguments[i]);
        }
        return args;
    }

    //export for the world
    module.exports.new = function(contextBinder, stackSafe){
        return new SwarmHarvest(contextBinder,stackSafe);
    };

    //export for the world
    module.exports.create = module.exports.new;
}();
