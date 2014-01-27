//simulate the painting of a penguin children. paint the male babies blue and female babies pink if their mother asynchronously agree
//test if all penguins got painted

var harvest = require("../lib/harvest.js").new(undefined, true);
var data    = require("./penguinsData.js");
var assert  = require("assert");

/*
process.on('uncaughtException', function (err) {
    console.log(err, err.stack);
}); */

setTimeout(function(){
    assert.equal(harvest.paintingComplete, true);
}, 300)


harvest.onFail(function(error, variable, index){
    console.log("Well, move those penguins to the South Pole...", error, variable, index);
});

harvest.let('father',data.loadPenguin, 'MrPenguin');
harvest.let('mother',data.loadPenguin, 'MrsPenguin');
harvest.let('family',data.loadPenguinFamily, wait('father'), wait('mother'));

harvest.onSuccess(function(harvestContext){
    //harvest.family is an array with little penguins
    console.log("Intermediate success!");
        for(var at = 0; at < harvestContext.family.length; at++){
            var littlePenguin = harvestContext.family[at];
            var color = littlePenguin.sex == 'male'?'blue':'pink';
            console.log("Asking agreement for ",littlePenguin.nick);
            harvestContext.letAt('agreementFather', at, data.givePaintAgreement, wait('father'), littlePenguin, color);
            harvestContext.letAt('agreementMother', at, data.givePaintAgreement, wait('mother'), littlePenguin, color);
        }

    //harvestContext.set('gotAgreement', true, wait('agreementFather'), wait('agreementMother'));

    //now that we got or first phase, we can redefine the success to ever more
    harvest.onSuccess(function(harvestContext){
            console.log("Second success!");
            harvestContext.set('paintingComplete', true, wait('completed'));

            for(var i = 0; i < harvestContext.family.length; i++){
                var littlePenguin = harvest.family[i];
                var color = littlePenguin.sex == 'male'?'blue':'pink';
                if(harvestContext.agreementFather[i] && harvestContext.agreementMother[i]){
                    console.log("Painting ",littlePenguin.nick);
                    harvestContext.letAt('completed', i, data.paintPenguin, littlePenguin, color);
                } else {
                    console.log("Agreements:", harvestContext.agreementFather[i] , harvestContext.agreementMother[i]);
                }
            }

            harvestContext.do(data.childPenguinsShouldBeBlue,harvestContext.father, harvestContext.mother, wait('paintingComplete'));

            harvest.onSuccess(function(harvestContext){

            })
        });
});


