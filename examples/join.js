
var Q = require("q/util");
var FS = require("q-fs");

var list = FS.list(__dirname);
var files = Q.when(list, function (list) {
    list.forEach(function (fileName) {
        var content = FS.read(fileName);
        Q.when(content, function (content) {
            console.log(fileName, content.length);
        });
    });
});

