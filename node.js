
var Q = require("./q");
var NQ = exports;

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
NQ.makeNodeResolver = function (resolve) {
    return function (error, value) {
        if (error) {
            resolve(Q.reject(error));
        } else if (arguments.length > 2) {
            resolve(Array.prototype.slice.call(arguments, 1));
        } else {
            resolve(value);
        }
    };
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      NQ.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
NQ.nfapply = function (callback, args) {
    var deferred = Q.defer();
    var nodeArgs = Array.prototype.slice.call(args);
    nodeArgs.push(NQ.makeNodeResolver(deferred.resolve));
    Q(callback).fapply(nodeArgs).catch(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
NQ.nfcall = function (callback /*...args*/) {
    var args = Array.prototype.slice.call(arguments, 1);
    return NQ.nfapply(callback, args);
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
NQ.nfbind =
NQ.denodeify = function (callback /*...args*/) {
    var baseArgs = Array.prototype.slice.call(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(Array.prototype.slice.call(arguments));
        var deferred = Q.defer();
        nodeArgs.push(NQ.makeNodeResolver(deferred.resolve));
        Q(callback).fapply(nodeArgs).catch(deferred.reject);
        return deferred.promise;
    };
};

NQ.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = Array.prototype.slice.call(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(Array.prototype.slice.call(arguments));
        var deferred = Q.defer();
        nodeArgs.push(NQ.makeNodeResolver(deferred.resolve));
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).catch(deferred.reject);
        return deferred.promise;
    };
};

/**
 * Wraps a NodeJS EventEmitter object and returns a function
 * that returns a promise that is:
 *  - Notified on the named event
 *  - Rejected on an 'error' event
 *  - Resolved on a 'close' event
 * @example
 * var server = net.createServer();
 * var serverEvent = Q.ebind(server);
 * serverEvent('connection')
 * .progress(handleNewConnection)
 * .catch(handleServerError)
 * .then(handleServerShutdown);
 * server.listen(9001);
 */
NQ.ebind = function (eventEmitter) {
    return function (eventName) {
        deferred = Q.defer();

        eventEmitter.on(eventName, deferred.notify);
        eventEmitter.on('error', deferred.reject);
        eventEmitter.on('close', deferred.resolve);

        return deferred.promise;
    }
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
NQ.npost = function (object, name, nodeArgs) {
    var deferred = Q.defer();
    nodeArgs.push(NQ.makeNodeResolver(deferred.resolve));
    Q(object).dispatch("post", [name, nodeArgs]).catch(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
NQ.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = Array.prototype.slice.call(arguments, 2);
    var deferred = Q.defer();
    nodeArgs.push(NQ.makeNodeResolver(deferred.resolve));
    Q(object).dispatch("post", [name, nodeArgs]).catch(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
NQ.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

