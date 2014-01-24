//simulate the painting of a penguin children. paint the male babies blue and female babies pink if their mother asynchronously agree
//test if all penguins got painted

var harvest = require("../lib/harvest.js").new();
var assert  = require("assert");

var penguins = {
    "MrPenguin":{
      nick:"MrPenguin"
    },
    "MrsPenguin":{
        nick:"MrsPenguin"
    },
    "Alice":{
        colour:"black",
        sex:"female",
        father:"MrPenguin",
        mother:"MrsPenguin"
    },
    "Bob":{
        colour:"green",
        sex:"male",
        father:"MrPenguin",
        mother:"MrsPenguin"
    },
    "Charlie":{
        colour:"black",
        sex:"male",
        father:"MrPenguin",
        mother:"MrsPenguin"
    },
    "Dostoevsky":{
        colour:"white",
        sex:"male"
    }
}

function loadPenguin(nick,success, error){
    if(penguins[nick]){
        success(penguins[nick]);
    } else {
        error(new Error("Penguin not available: " +nick));
    }
}

function loadPenguinFamily(father, mother, success, error){
        var ret = [];
        for(var v in penguins){
            if(penguins[v].father == father.nick && penguins[v].mother == mother.nick){
                ret.push(penguins[v]);
            }
        }
    success(ret);
}

function paintPenguin(penguin, newColour){
    penguin.colour = newColour;
}

function childPenguinsShouldBeBlue(father, mother){
    for(var v in penguins){
        if(penguins[v].father == father.nick && penguins[v].mother == mother.nick){
            if(penguins[v].sex == "male"){
                assert.equal(penguins[v],"blue");
            } else {
                assert.equal(penguins[v],"pink");
            }
        }
    }
}

function givePaintAgreement(parent,child,colour,success, error){
    success(true);
}

harvest.load('father',loadPenguin, 'MrPenguin');
harvest.load('mother',loadPenguin, 'MrsPenguin');
harvest.load('family',loadPenguinFamily, '@father', '@mother');

harvest.onSuccess(function(harvest){
    //harvest.family is an array with little penguins
        for(var at = 0; at < harvest.family.length; at++){
            var littlePenguin = harvest.family[at];
            var color = littlePenguin.sex == 'male'?'blue':'pink';
            harvest.loadAt('agreementFather', at, givePaintAgreement, wait('father'), littlePenguin, color);
            harvest.loadAt('agreementMother', at, givePaintAgreement, wait('mother'), littlePenguin, color);
        }

    //now that we got or first phase, we can redefine the success to ever more
    harvest.onSuccess(function(harvest){
            for(var i = 0; i < harvest.family.length; i++){
                var littlePenguin = harvest.family[i];
                var color = littlePenguin.sex == 'male'?'blue':'pink';
                if(harvest.agreementFather[i] && harvest.agreementMother[i]){
                    harvest.do('paintPenguin',littlePenguin,color, wait(father));  // not used but could be useful
                }
            }

            harvest.set('paintingComplete', true);
            harvest.do('childPenguinsShouldBeBlue',wait('father'), wait('mother'), wait('paintingComplete'));
        });
});

harvest.onError = function(harvest){
    console.log("Well, move those penguins to the South Pole...");
}

setTimeout(function(){
       assert.equal(harvest.paintingComplete, true);
}, 100)