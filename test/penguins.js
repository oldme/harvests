//simulate the painting of a penguin children. paint the male babies blue and female babies pink if their mother asynchronously agree
//test if all penguins got painted

var harvest = require("harvest").newHarvest();

function loadPenguin(id,success, error){

}

function loadPenguinFamily(father,mother, success, error){

}

function paintPenguin(id,newColour,success, error){

}

function givePaintAgreements(parent,child,colour,success, error){

}

harvest.load('@father',loadPenguin, 'MrPenguin');
harvest.load('@mother',loadPenguin, 'MrsPenguin');
harvest.load('@family',loadPenguinFamily, '@father', '@mother');

harvest.onSuccess(function(harvest){
    //harvest.family is an array with little penguins
        for(var at=0; at<harvest.family.length; at++){
            var littlePenguin = harvest.family[at];
            var color = littlePenguin.sex == 'male'?'blue':'pink';
            harvest.loadAt('@agreement', at, givePaintAgreements, '@mother',littlePenguin,color);
        }

    //now that we got or first phase, we can redefine the success to ever more
    harvest.onSuccess(function(harvest){
            for(var i=0; i<harvest.family.length; i++){
                var littlePenguin = harvest.family[i];
                var color = littlePenguin.sex == 'male'?'blue':'pink';
                harvest.do('paintPenguin',littlePenguin,color);
            }
        });
});

harvest.onError = function(harvest){
    console.log("Well, move those penguins to the South Pole...");
}

