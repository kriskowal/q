
require("../test");
var Reporter = require("./node-reporter");

var suite = describe("Q", function () {
    require("./q");
    require("./eta");
    require("./traces");
    require("./never-again");
    require("./node");
    require("./queue");
    require("./domain");
});

var report = new Reporter();
suite.run(report)
.then(function () {
    report.summarize(suite);
    if (report.failed) {
        process.exit(-1);
    }
})
.done();

