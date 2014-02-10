
require("../test");
var Reporter = require("./browser-reporter");

var suite = describe("Q", function () {
    require("./q");
    require("./eta");
    require("./traces");
    require("./never-again");
    require("./node");
    require("./queue");
});

var report = new Reporter();
suite.run(report)
.then(function () {
    report.summarize(suite);
})
.done();

