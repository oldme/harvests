var harvest = require("../lib/harvest.js").new(undefined, false);
var fs = require('fs');

harvest.onFail(function(error, variable, index){
    console.log("Error:", error, variable, index);
});


harvest.let("myFileContent", fs.readFile, "./fileTest.js" , {encoding:'utf8'} );
harvest.do(console.log, wait("myFileContent"));

