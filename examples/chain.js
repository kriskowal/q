"use strict";

var Q = require("../q");

function task(i) {
    return function(deferred) {
        var delay = Math.floor(1000 * (Math.random() * 10) + 1);
        console.log(delay);
        setTimeout(function() {
            deferred.resolve(function() {
                console.log(i);
            });
        }, delay)
    }
}

Q.chain([task(0), task(1), task(2), task(3), task(4), task(5)]);