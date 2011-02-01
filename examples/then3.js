
var Q = require("q/util");
var FS = require("q-fs");

Q.when(FS.list(__dirname))
.then(function (fileNames) {
    return Q.deep(fileNames.map(function (fileName) {
        return {
            "name": fileName,
            "text": FS.read(FS.join(__dirname, fileName))
        };
    }));
}).then(function (files) {
    files.forEach(function (file) {
        console.log(file.name, file.text.length);
    });
});

