var harvest = require("../lib/harvest.js").new(undefined, true);
var assert = require("assert");

function asynRandBack(callback){
    setTimeout(function(){
        var rand = Math.floor(Math.random() * 100);
        callback(undefined,rand);
    }, 100)
}

 for(var i =0; i < 10; i++){
     harvest.letAt("results", 'member'+i,asynRandBack );
 }

harvest.do(testResults, wait('results'));


function testResults(){
    console.log("Checking", harvest.results);
    assert.notEqual(harvest.results['member5'], undefined);
}

harvest.onFail(function(err, varName, index){
    console.log("Unknown fail ", err, varName, index);
})
