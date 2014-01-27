var harvest = require("harvests").create(undefined, false);


function loadPenguin(nickName, callBack){
    callBack(undefined,nickName);
}

function loadPenguinFamily(father, mother, callBack){
    callBack(undefined, 'In harvest.family we got those cute penguin children objects');
}

harvest.onSuccess(function(theHarvest){
    console.log("All those 3 requests are completed with success");
});

harvest.onFail(function(harvest){
    console.log("Well, move those penguins to the South Pole...");
});



harvest.let('father', loadPenguin, 'MrPenguin');
harvest.let('mother', loadPenguin, 'MrsPenguin');
harvest.let('family', loadPenguinFamily, wait('father'), wait('mother'));

harvest.do(function(family){
    console.log(family);
}, wait('family') );


