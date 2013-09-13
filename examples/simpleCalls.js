var Q = require('../q');

function log() {
    console.log.apply(console, arguments);
}

Q('----------- tic 1 -----------').done(log); // next tic
Q().thenResolve('----------- tic 2 -----------').done(log); // in 2 tics
Q().thenResolve().thenResolve('----------- tic 3 -----------').done(log); // in 3 tics


Q(1).then(log).done(); //logs '1'

Q().thenResolve(2).done(log); //logs '2'

Q(5).then(Q.fbind(log, 3, 4)).done(); //logs '3 4 5'

Q(log).fapply([6, 7, 8]).done(); //logs '6 7 8'

Q(log).fcall(9, 10, 11).done(); //logs '9 10 11'

Q.try(log, 12, 13).done(); //logs '12, 13' (same as fcall)


log('----------- tic 0 -----------');  //called this tic
