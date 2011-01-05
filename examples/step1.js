
var Q = require("q/util");
var FS = require("q-fs");

Q.step(
    function () {
        return FS.read(__filename);
    },
    function (text) {
        return text.toUpperCase();
    },
    function (text) {
        console.log(text);
    }
);

