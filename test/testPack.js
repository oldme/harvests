
var harvest = require("../lib/harvest.js").new(undefined, false);
var assert = require("assert");


var penguinNames = ["a", "b", "c"];
var penguins = {"a":"pa", "b":"pb", "c":"pc" };

function loadPenguin(name, callBack){
    var rp = penguins[name];
    if(rp){
        callBack(undefined, rp);
    } else {
        callBack(new Error("Unknown penguin"));
    }
}

penguinNames.map(function (name){
    harvest.pack("realPenguins", loadPenguin, name);
    //harvest.letAt("realPenguins", name, loadPenguin, name); //similar results
});

harvest.do(workWithPenguins, wait('realPenguins'));

harvest.onFail(function(err, varName, index){
    console.log("Unknown fail ", err, varName, index);
})

function workWithPenguins(){
    console.log(harvest.realPenguins);
    assert.equal(harvest.realPenguins.length, 3);
}
