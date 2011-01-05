
var Q = require("q/util");
var FS = require("q-fs");

Q.step(
    function () {
        return [
            FS.read(__filename),
            FS.read("/etc/passwd")
        ];
    },
    function (self, passwd) {
        console.log(__filename + ':', self.length);
        console.log('/etc/passwd:', passwd.length);
    }
);

