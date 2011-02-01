
var Q = require("q");
var FS = require("q-fs");

Q.when(FS.read(__filename))
.then(function (text) {
    return text.toUpperCase();
}).then(function (text) {
    console.log(text);
});

