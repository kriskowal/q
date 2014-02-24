
// "Isomprphic" test suite runner. This can be executed either:
//     run node test/index.js
//     or visit test/index.html (which loads this with Mr)

var Suite = require("jasminum/suite");
var Q = require("../q");

var suite = new Suite("Q").describe(function () {

    require("./q-test");
    require("./eta-test");
    require("./traces-test");
    require("./never-again-test");
    require("./node-test");
    require("./queue-test");

    if (typeof process !== "undefined" && process.domain === null) {
        // Parens around require signify that this is not a dependency as far
        // as the browser loader is concerned.
        (require)("./domain-test");
    }

});

suite.runAndReport(Q.Promise).done();

