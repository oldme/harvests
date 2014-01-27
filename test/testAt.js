var harvest = require("../lib/harvest.js").new(undefined, false);
var assert = require("assert");

function asynRandBack(callback){
    setTimeout(function(){
        var rand = Math.floor(Math.random() * 100);
        callback(undefined,rand);
    }, 100)
}

 for(var i =0; i < 10; i++){
     harvest.letAt("results", i, asynRandBack );
 }

harvest.do(testResults, wait('results'));


function testResults(){
    console.log(harvest.results);
    assert.equal(harvest.results.length, 10);
}

harvest.onFail(function(err, varName, index){
    console.log("Unknown fail ", err, varName, index);
})
