
var Q = require("q/util");
var FS = require("q-fs");

Q.step(
    function () {
        return FS.list(__dirname);
    },
    function (fileNames) {
        return fileNames.map(function (fileName) {
            return [fileName, FS.read(fileName)];
        });
    },
    function (files) {
        files.forEach(function (pair) {
            var fileName = pair[0];
            var file = pair[1];
            console.log(fileName, file.length);
        });
    }
);

