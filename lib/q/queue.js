(function (require, exports) {

// Copyright (C) 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * An infinite queue where (promises for) values can be dequeued 
 * before they are enqueued.
 * 
 * Based on a similar example in Flat Concurrent Prolog, perhaps by
 * Ehud (Udi) Shapiro.
 * 
 * @author Mark S. Miller
 */

var Q = require("q");

exports.Queue = Queue;
function Queue() {
    var ends = Q.defer();
    var closed = Q.defer();
    return {
        "put": function (value) {
            var next = Q.defer();
            ends.resolve({
                "head": value,
                "tail": next.promise
            });
            ends.resolve = next.resolve;
        },
        "get": function () {
            var result = Q.get(ends.promise, "head");
            ends.promise = Q.get(ends.promise, "tail");
            return Q.when(result, null, function (reason) {
                closed.resolve();
                return Q.reject(reason);
            });
            return result;
        },
        "closed": closed.promise,
        "close": function (reason) {
            var end = {"head": Q.reject(reason)};
            end.tail = end;
            ends.resolve(end);
            return closed.promise;
        }
    };
}

// boilerplate that permits this module to be used as a
// <script> in less-than-ideal situations.
}).apply(this, typeof exports !== "undefined" ? [
    require, exports
] : [
    (function (global) {
        return function (id) {
            return global["/" + id];
        };
    })(this),
    this["/q/queue"] = {}
]);
