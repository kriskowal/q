// vim:ts=4:sts=4:sw=4:
/* global describe, xdescribe, ddescribe, it, xit, iit, expect, beforeEach,
   afterEach */

require("collections/shim");
var Q = require("../q");

var currentSuite;
var currentTest;
var currentReport;

describe = function (name, callback) {
    if (currentSuite) {
        var parent = currentSuite;
        currentSuite = parent.nestSuite(name);
        callback();
        currentSuite = parent;
    } else {
        var root = new Suite(name);
        currentSuite = root;
        try {
            callback();
        } finally {
            currentSuite = null;
        }
        return root;
    }
};

xdescribe = function (name, callback) {
    var parent = currentSuite.nestSuite(name);
    currentSuite = parent.nestSuite(name);
    currentSuite.skip = true;
    callback();
    currentSuite = parent;
};

ddescribe = function (name, callback) {
    var parent = currentSuite;
    currentSuite = parent.nestSuite(name, true);
    callback();
    currentSuite = parent;
};

it = function (name, callback) {
    currentSuite.nestTest(name, callback);
};

iit = function (name, callback) {
    currentSuite.nestTest(name, callback, true);
};

xit = function (name, callback) {
    var test = currentSuite.nestTest(name, callback);
    test.skip = true;
};

beforeEach = function (callback) {
    if (!currentSuite) {
        throw new Error("Cannot use `beforeEach` outside of a 'define' block");
    }
    currentSuite.beforeEach = callback;
};

afterEach = function (callback) {
    if (!currentSuite) {
        throw new Error("Cannot use `afterEach` outside of a 'define' block");
    }
    currentSuite.afterEach = callback;
};

expect = function (value) {
    if (!currentTest) {
        throw new Error("Cannot declare an expectation outside of an 'it' block");
    }
    return new currentTest.Expectation(value, currentTest);
};

function Expectation(value, test) {
    this.value = value;
    this.test = test;
    this.not = Object.create(this);
    this.not.isNot = true;
}

function getStackTrace() {
    var stack = new Error("").stack;
    if (typeof stack === "string") {
        return stack.replace(/^[^\n]*\n[^\n]\n/, "");
    } else {
        return stack;
    }
}

function expectMethod(operator, operatorName) {
    return function (value) {
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(value, this.value);
        var guard = operator.apply(void 0, args);
        var stack = getStackTrace();
        var assertion = {
            operator: (this.isNot ? "not " : "") + operatorName,
            not: this.isNot,
            expected: this.value,
            actual: value,
            stack: stack || ""
        };
        if (!!guard === !!this.isNot) {
            currentReport.failAssertion(assertion);
        } else {
            currentReport.passAssertion(assertion);
        }
    };
}

function lessThan(a, b) {
    return Object.compare(a, b) < 0;
}

function greaterThan(a, b) {
    return Object.compare(a, b) > 0;
}

function near(a, b, epsilon) {
    var difference = Math.abs(Object.compare(a, b));
    if (difference === 0) {
        return Object.equals(a, b);
    } else {
        return difference < epsilon;
    }
}

// TODO extensible expectations
Expectation.prototype.equals = expectMethod(Object.equals, "to equal");
Expectation.prototype.is = expectMethod(Object.is, "to be");
Expectation.prototype.has = expectMethod(Object.has, "to have");
Expectation.prototype.contains = expectMethod(Object.contains, "to contain");
Expectation.prototype.lessThan = expectMethod(lessThan, "to be less than");
Expectation.prototype.greaterThan = expectMethod(greaterThan, "to be greater than");
Expectation.prototype.near = expectMethod(near, "to be near");

function Suite(name) {
    this.name = name;
    this.exclusive = false;
    this.root = this;
    this.children = [];
    this.testCount = 0;
}

Suite.prototype.type = "describe";

Suite.prototype.nestSuite = function (name, exclusive) {
    var child = Object.create(this);
    child.parent = this;
    child.name = name;
    child.children = [];
    child.exclusive = false;
    this.children.push(child);
    if (exclusive) {
        child.setExclusive();
    }
    return child;
};

Suite.prototype.nestTest = function (name, callback, exclusive) {
    var child = new this.Test(name, callback, this, this.root);
    this.root.testCount++;
    child.exclusive = !!exclusive;
    this.children.push(child);
    if (exclusive) {
        this.setExclusive();
    }
    return child;
};

Suite.prototype.setExclusive = function () {
    var parent = this;
    while (parent) {
        parent.exclusive = true;
        parent = parent.parent;
    }
};

Suite.prototype.run = function (report) {
    var self = this;
    if (self.skip) {
        return Q();
    }
    self.started = true;
    var exclusiveChildren = self.children.filter(function (child) {
        return child.exclusive;
    });
    var children = exclusiveChildren.length ? exclusiveChildren : self.children;
    var suiteReport = report.start(self);
    return children.reduce(function (previous, child) {
        return previous.then(function () {
            if (child.run) {
                return child.run(suiteReport);
            }
        });
    }, Q())
    .finally(function () {
        suiteReport.end(self);
        self.finished = true;
    });
};

Suite.prototype.Test = Test;

function Test(name, callback, suite, root) {
    this.name = name;
    this.callback = callback;
    this.children = [];
    this.suite = suite;
    this.root = root;
}

Test.prototype.Expectation = Expectation;

Test.prototype.type = "it";

Test.prototype.run = function (report) {
    var self = this;
    self.started = true;
    currentTest = self;
    currentReport = report.start(self);
    return Q.try(function () {
        if (!self.skip) {
            return Q.try(function () {
                if (self.suite.beforeEach) {
                    return call(self.suite.beforeEach, currentTest, currentReport, "before");
                }
            })
            .then(function () {
                return call(self.callback, currentTest, currentReport, "during");
            })
            .finally(function () {
                if (self.suite.afterEach) {
                    return call(self.suite.afterEach, currentTest, currentReport, "after");
                }
            });
        }
    })
    .timeout(3000)
    .then(function () {
        if (self.skip) {
            currentReport.skip(self);
        }
    }, function (error) {
        currentReport.error(error, self);
    })
    .finally(function () {
        currentReport.end(self);
        currentTest = null;
        currentReport = null;
    });
};

function call(callback, test, report, phase) {
    function done(error) {
        if (!deferred.promise.isPending()) {
            report.error(new Error("`done` called multiple times " + phase + " " + JSON.stringify(test.name)), test);
        }
        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve();
        }
    }
    if (callback.length === 1) {
        var deferred = Q.defer();
        callback(done);
        return deferred.promise;
    } else {
        return callback();
    }
}

