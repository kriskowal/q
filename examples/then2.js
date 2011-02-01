
var Q = require("q/util");
var FS = require("q-fs");

Q.when(Q.deep({
    "self": FS.read(__filename),
    "passwd": FS.read("/etc/passwd")
})).then(function (texts) {
    console.log(__filename + ":" + texts.self.length);
    console.log("/ext/passwd:" + texts.passwd.length);
});

