
jasmine.Block.prototype.execute = function (onComplete) {
    var spec = this.spec;
    var result;
    try {
        result = this.func.call(spec, onComplete);
        if (result) {
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

