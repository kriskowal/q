var Q = require('../q');

function log() {
    console.log.apply(console, arguments);
}

Q('----------- tic 1 -----------').then(log).done(); // next tic
Q().thenResolve('----------- tic 2 -----------').then(log).done(); // in 2 tics
Q().thenResolve().thenResolve('----------- tic 3 -----------').then(log).done(); // in 3 tics


Q(1).then(log).done(); //logs '1'

Q().thenResolve(2).then(log).done(); //logs '2'

Q(5).then(Q.fbind(log, 3, 4)).done(); //logs '3 4 5'

Q().thenResolve(log).fapply([6, 7, 8]).done(); //logs '6 7 8'

Q(9).then(Q.fcall(log, 10, 11)).done(); //logs '10 11' (no 9)

Q.try(log, 12, 13).done(); //logs '12, 13'


log('----------- tic 0 -----------');  //called this tic
