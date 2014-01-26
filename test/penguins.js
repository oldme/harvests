//simulate the painting of a penguin children. paint the male babies blue and female babies pink if their mother asynchronously agree
//test if all penguins got painted

var harvest = require("../lib/harvest.js").new(undefined, true);
var data    = require("./penguinsData.js");
var assert  = require("assert");

process.on('uncaughtException', function (err) {
    console.log(err, err.stack);
});

setTimeout(function(){
    assert.equal(harvest.paintingComplete, true);
}, 300)


harvest.onFail(function(error){
    console.log("Well, move those penguins to the South Pole...");
});

harvest.load('father',data.loadPenguin, 'MrPenguin');
harvest.load('mother',data.loadPenguin, 'MrsPenguin');
harvest.load('family',data.loadPenguinFamily, wait('father'), wait('mother'));

harvest.onSuccess(function(harvestContext){
    //harvest.family is an array with little penguins
    console.log("Intermediate success!");
        for(var at = 0; at < harvestContext.family.length; at++){
            var littlePenguin = harvestContext.family[at];
            var color = littlePenguin.sex == 'male'?'blue':'pink';
            console.log("Asking agreement for ",littlePenguin.nick);
            harvestContext.loadAt('agreementFather', at, data.givePaintAgreement, wait('father'), littlePenguin, color);
            harvestContext.loadAt('agreementMother', at, data.givePaintAgreement, wait('mother'), littlePenguin, color);
        }

    //now that we got or first phase, we can redefine the success to ever more
    harvest.onSuccess(function(harvestContext){
            console.log("Second success!");


            for(var i = 0; i < harvestContext.family.length; i++){
                var littlePenguin = harvest.family[i];
                var color = littlePenguin.sex == 'male'?'blue':'pink';
                if(harvestContext.agreementFather[i] && harvestContext.agreementMother[i]){
                    console.log("Painting ",littlePenguin.nick);
                    harvestContext.do(data.paintPenguin,littlePenguin,color, wait('father'));  // wait, not used but could be useful
                } else {
                    console.log("Agreements:", harvestContext.agreementFather[i] , harvestContext.agreementMother[i]);
                }
            }

            harvestContext.set('paintingComplete', true);
            console.log("Painting...");
            harvestContext.do(data.childPenguinsShouldBeBlue,wait('father'), wait('mother'), wait('paintingComplete'));
        });
});


