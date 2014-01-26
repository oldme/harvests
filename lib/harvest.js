
/*
    asynch-harvest
 */

var init = function(){

    function SwarmHarvest(contextBinder, preventStackOverflow){
        var self = this;
        var internalFinishStatus = 0; // -1 error, 0 working, 1 succes
        var internalSuccessHandler;
        var internalFailHandler;
        var waitingCounter = 1; // prevent declaring success too fast
        process.nextTick(newAnswer); //may be it got loaded entirely synchronously

        function newWait(){
            waitingCounter++;
        }

        function newAnswer(){
            waitingCounter--;
            if(waitingCounter == 0 && internalFinishStatus == 0){
                internalFinishStatus = 1;
                if(internalSuccessHandler){
                    waitingCounter++;        //prevent declaring success too fast in loads started in succes handlers
                    internalSuccessHandler(self);
                    process.nextTick(newAnswer); // clean waitingCounter, for reuse, etc
                }
            }
        }



        /*
         the default call convention is that a function takes 2 functions for the last 2 parameters, one for reporting success and a result and one for reporting errors
         */

        function defaultHarvestCallConvention(harvest, callBack, args, variable, position){
            var success = function(result){
                harvest.__callResult(result,variable, position);
            };

            var fail = function(error){
                harvest.__callError(error);
            };

            args.push(success);
            args.push(fail);

            var callFunct =  function(){
                try{
                    callBack.apply(null, args);
                } catch(err){
                    console.log("Error in ", callBack, variable, position, err, err.stack);
                    harvest.__callError(err);
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
                if(error){
                    harvest.__callError(error);
                } else {
                    harvest.__callResult(result,variable, position);
                }
            };

            args.push(retCallback);

            process.nextTick(function(){
                    callBack.apply(null, args);
                }
            );
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


        //return -1 if error, 0 if continue, 1 for success
        this.finished = function(){
            return internalFinishStatus;
        };

        //public for the sake of custom conventions
        this.__callError = function(error){
            internalFinishStatus = -1;
            if(internalFailHandler){
                internalFailHandler( error );
            } else {
                console.log("Untreated fail. Add onFail call to your harvest!");
            }
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

        //public for the sake of custom conventions
        this.__callResult = function(result, variable, position){
            var fv = getVariableByName(variable);

            if(internalFinishStatus == 0){
                if(variable){
                    if(position != undefined){
                        if(this[variable] == undefined){
                            this[variable] = [];
                        }
                        this[variable][position] = result;
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
                getVariableByName(variableName);
            }

            if(!convention){
                convention =  defaultHarvestCallConvention;
            }

            var freeVars = detectFreeVars(args);
            var pending = new PendingCall(convention, variableName, index, apiFunction, args, freeVars);

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
            createPendingCall(undefined, undefined, apiFunction , args);
        };

        this.set = function(variableName, value ){
            var args = mkArgs(arguments, 2);
            createPendingCall(variableName, undefined, function(success){
                    self[variableName] = value;
                    success(value);
                },
                args);
        };

        this.load = function(variableName, callback ){
            var args = mkArgs(arguments, 2);
            var apiFunction = bindContext(callback);
            createPendingCall(variableName, undefined, apiFunction , args);
        };

        this.loadAt = function(arrayName, index,  callback ){
            var args = mkArgs(arguments, 3);
            var apiFunction = bindContext(callback);
            createPendingCall(arrayName, index, apiFunction , args);
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

        // inside function because use self,waitingCounter
        function PendingCall(callConvention, variable, position, callBack, args, freeVariables){
            this.index = position;
            this.debugName =  variable;

            if(internalFinishStatus >0){
                internalFinishStatus = 0; //reset it anyway
            }
            var consumableList = freeVariables.strings.slice(0);
            newWait();
            this.bindFreeVariable = function(otherVariable){
                var index = consumableList.indexOf(otherVariable,0);
                if(index != -1){
                    consumableList.splice(index,1);
                } else {
                    self.__callError(new Error("Harvesting error, multiple results for the same variable"));
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

        this.name = function(){
            return name;
        };

        var arrayWaitCounter = 0;

        this.addPendingCall = function(pc){
            if(pc.index){
                arrayWaitCounter++;
            }
            waitingList.push(pc);
        };

        var __value = this;

        this.setValue = function(variable, position, value){
            __value = value;

            if(position != undefined){
                arrayWaitCounter--;
                if(arrayWaitCounter != 0){
                    return ;
                }
            }
            //bind all dependencies that are waiting
            for(var i = 0; i < waitingList.length; i++){
                waitingList[i].bindFreeVariable(variable);
            }
        };

        this.value = function(){
            return __value == this? undefined : __value;
        };

        this.hasValue = function(){
            return __value != this;
        };
    }

    SwarmHarvest.prototype.wait = function(name){
        return new HarvestWaitingVariable(name);
    };

    //trying to not pollute the global space, as this library should be used in many projects. Define your own wait function if wait is taken
    if (typeof wait != 'undefined') {
        console.log("Warning: refusing to overwrite 'wait' for use with asyn-harvest library. 'wait' is already defined. Rename your 'wait', or rename SwarmHarvest.prototype.wait. Also you can use @ notation instead of wait.");
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
}();
