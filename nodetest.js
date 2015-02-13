var q = require("./q/index.js");

q.reject("Heh");

process.on("unhandledRejection", function(handler, reason){
	console.log("Found it!", handler, "reason", reason);
});