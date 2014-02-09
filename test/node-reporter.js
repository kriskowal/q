
require("colors");

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
    console.log((Array(child.depth + 1).join("❯") + " " + test.type + " " + test.name).grey);
    return child;
};

Reporter.prototype.end = function (test) {
    if (test.type === "it") {
        if (this.failed) {
            this.root.failed++;
        } else if (this.skipped) {
            this.root.skipped++;
        } else {
            this.root.passed++;
        }
    }
};

Reporter.prototype.summarize = function (suite) {
    if (!this.failed && this.passed) {
        console.log((this.passed + " passed tests").green);
    } else {
        console.log(this.passed + " passed tests");
    }
    if (!this.failedAssertions && this.passedAssertions) {
        console.log((this.passedAssertions + " passed assertions").green);
    } else {
        console.log(this.passedAssertions + " passed assertions");
    }
    if (this.failed) {
        console.log((this.failed + " failed tests").red);
    } else {
        console.log(this.failed + " failed tests");
    }
    if (this.failedAssertions) {
        console.log((this.failedAssertions + " failed assertions").red);
    } else {
        console.log(this.failedAssertions + " failed assertions");
    }
    if (this.errors) {
        console.log((this.errors + " errors").red);
    } else {
        console.log(this.errors + " errors");
    }
    var skipped = suite.testCount - this.passed - this.failed;
    if (skipped) {
        console.log((skipped + " skipped tests").cyan);
    }
};

Reporter.prototype.skip = function () {
    this.skipped = true;
    this.root.skipped++;
};

Reporter.prototype.failAssertion = function (assertion) {
    console.log("expected".red);
    console.log(assertion.expected);
    console.log(assertion.operator.red);
    console.log(assertion.actual);
    console.log("at".red);
    console.error(assertion.stack);
    this.failed = true;
    this.root.failedAssertions++;
};

Reporter.prototype.passAssertion = function () {
    this.root.passedAssertions++;
};

Reporter.prototype.error = function (error, test) {
    this.failed = true;
    this.root.errors++;
    console.error(error.stack);
};

