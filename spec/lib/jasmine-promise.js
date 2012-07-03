"use strict";

jasmine.Block.prototype.execute = function (onComplete) {
    var spec = this.spec;
    var result;
    try {
        result = this.func.call(spec, onComplete);

        // It seems Jasmine likes to return the suite if you pass it anything.
        // So make sure it's a promise first.
        if (result && typeof result.then === "function") {
            result.then(function () {
                onComplete();
            }, function (error) {
                spec.fail(error);
                onComplete();
            });
        } else if (this.func.length === 0) {
            onComplete();
        }
    } catch (error) {
        spec.fail(error);
        onComplete();
    }
};

