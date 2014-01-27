
var assert  = require("assert");

var penguins = {
    "MrPenguin":{
        nick:"MrPenguin"
    },
    "MrsPenguin":{
        nick:"MrsPenguin"
    },
    "Alice":{
        nick:"Alice",
        colour:"black",
        sex:"female",
        father:"MrPenguin",
        mother:"MrsPenguin"
    },
    "Bob":{
        nick:"Bob",
        colour:"green",
        sex:"male",
        father:"MrPenguin",
        mother:"MrsPenguin"
    },
    "Charlie":{
        nick:"Charlie",
        colour:"black",
        sex:"male",
        father:"MrPenguin",
        mother:"MrsPenguin"
    },
    "Zuzu":{
        nick:"Zuzu",
        colour:"red",
        sex:"male"
    }
}

module.exports.loadPenguin = function (nick,success, error){
    if(penguins[nick]){
        success(penguins[nick]);
    } else {
        error(new Error("Penguin not available: " +nick));
    }
}

module.exports.loadPenguinFamily = function (father, mother, success, error){
    var ret = [];
    for(var v in penguins){
        if(penguins[v].father == father.nick && penguins[v].mother == mother.nick){
            ret.push(penguins[v]);
        }
    }
    success(ret);
}

module.exports.paintPenguin = function(penguin, newColour, callback){
    console.log(penguin.nick, " is now ", newColour);
    penguin.colour = newColour;
    callback(undefined,true);
}

    module.exports.childPenguinsShouldBeBlue = function (father, mother){
    for(var v in penguins){
        if(penguins[v].father == father.nick && penguins[v].mother == mother.nick){
            if(penguins[v].sex == "male"){
                assert.equal(penguins[v].colour,"blue");
            } else {
                assert.equal(penguins[v].colour,"pink");
            }
        }
    }
    console.log("Checked and done!");
}

module.exports.givePaintAgreement = function (parent,child,colour,success, error){
    success(true);
}

