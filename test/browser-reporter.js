
var body = document.querySelector("body");
body.classList.add("testing");

module.exports = Reporter;
function Reporter() {
    this.root = this;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.errors = 0;
    this.passedAssertions = 0;
    this.failedAssertions = 0;
    this.depth = 0;
}

Reporter.prototype.start = function (test) {
    var child = Object.create(this);
    child.depth = this.depth + 1;
    child.failed = false;
    child.skipped = false;
    console.group(test.type + " " + test.name);
    return child;
};

Reporter.prototype.end = function (test) {
    if (test.type === "it") {
        if (this.failed) {
            this.root.failed++;
            body.classList.add("fail");
            console.error("FAIL");
        } else if (this.skipped) {
            this.root.skipped++;
        } else {
            this.root.passed++;
        }
    }
    console.groupEnd();
};

Reporter.prototype.summarize = function (suite) {
    if (!this.failed) {
        body.classList.add("pass");
    }
    console.log(this.passed + " passed tests");
    console.log(this.passedAssertions + " passed assertions");
    if (this.failed) {
        console.error(this.failed + " failed tests");
    } else {
        console.log(this.failed + " failed tests");
    }
    if (this.failedAssertions) {
        console.error(this.failedAssertions + " failed assertions");
    } else {
        console.log(this.failedAssertions + " failed assertions");
    }
    console.log(this.errors + " errors");
    var skipped = suite.testCount - this.passed - this.failed;
    console.log(skipped + " skipped tests");
};

Reporter.prototype.skip = function () {
    this.skipped = true;
    this.root.skipped++;
};

Reporter.prototype.failAssertion = function (assertion) {
    console.log("expected");
    console.log(assertion.expected);
    console.log(assertion.operator);
    console.log(assertion.actual);
    console.log("at");
    console.error(assertion.stack);
    this.failed = true;
    this.root.failedAssertions++;
};

Reporter.prototype.passAssertion = function () {
    this.root.passedAssertions++;
};

Reporter.prototype.error = function (error, test) {
    this.failed = true;
    this.root.erros++;
    console.log(error.stack);
};

