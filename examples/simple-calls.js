"use strict";

var Q = require("../q");

function log() {
    console.log.apply(console, arguments);
}

Q("----------- tick 1 -----------").done(log); // next tick
Q().thenResolve("----------- tick 2 -----------").done(log); // in 2 ticks
Q().thenResolve().thenResolve("----------- tick 3 -----------").done(log); // in 3 ticks


Q(1).then(log).done(); //logs "1"

Q().thenResolve(2).done(log); //logs "2"

Q(5).then(Q.fbind(log, 3, 4)).done(); //logs "3 4 5"

Q(log).fapply([6, 7, 8]).done(); //logs "6 7 8"

Q(log).fcall(9, 10, 11).done(); //logs "9 10 11"

Q.try(log, 12, 13).done(); //logs "12, 13" (same as fcall)


log("----------- tick 0 -----------");  //called this tick
