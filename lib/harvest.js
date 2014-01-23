
/*


 */

function SwarmHarvest(contextBinder){

    /*
        Asume that API function takes as last 2 parameters 2 functions, one for succes and one for error
     */
    this.load = function(variableName, callback ){

    }

    this.loadAt = function(arrayName,idex,  callback ){

    }

    this.loadWithConvention = function(variableName, convention, api ){
        //to be implemented. convention is a method that knows how to call the API function
    }

    this.onFail = function(callBack){

    }

    this.onSuccess = function(callBack){

    }

    this.finished = function(){
        //return -1 if error, 0 if continue, 1 for success
    }
}

exports.newHarvest = function(){

}


