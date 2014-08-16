/**
 * Local data access test/dev script
 * Written for Node
 */
"use strict";

var Q = require("../q");


Q(10)
    .local(function(localData) {
       localData.testValue = 1000;
    })
    .then(function() {
        return Q.all([
            Q(40).local(function (localData) {
                localData.allValue = 111;
            }),
            Q(50).local(function (localData) {
                localData.allValue2 = 222;
            })
        ]);
    })
    .local(function(localData) {
        if( ( localData.allValue !== 111 ) || ( localData.allValue2 !== 222 ) ) {
            console.error( localData );
            throw new Error( "Failed v7" );
        }
    })
/*    .then(function() {
        return Q(30)
            .local(function(localData) {
                if( localData.testValue !== 1000 )
                {
                    console.error( localData );
                    throw new Error( "Failed v4" );
                }

                localData.testValue = 1001;
            })
            .thenResolve(4);
    })
    .local(function(localData) {
        if( localData.testValue !== 1001 ) {
            console.error(localData);
            throw new Error("Failed v1");
        }
    })
   .then(function() {
        return Q(20).local(function(localData) {
           if( localData.testValue !== 1001 ) {
                console.error(localData);
                throw new Error("Failed v2");
            }
        });
    })
    .then(function() {
        var deferred = Q.defer();

        deferred.resolve(true);

        return deferred.promise.local( function( localData ) {
           if( localData.testValue !== 1001 ) {
                console.error(localData);
                throw new Error("Failed v5");
            }
        });
    })
    .then(function() {
        var deferred = Q.defer();

        setTimeout( function() { deferred.resolve(true); }, 10 );

        return deferred.promise.local( function( localData ) {
           if( localData.testValue !== 1001 ) {
                console.error(localData);
                throw new Error("Failed v6");
            }
        });
    })
    .thenResolve( 49 )
    .then( function() {
        return Q(20)
            .then(function() {
               return 4114;
            });
    })
    .then( function() {
    })
   .then(function() {
        return Q(20)
        .then(function() {
        })
        .local(function(localData) {
            if( localData.testValue !== 1001 ) {
                console.error(localData);
                throw new Error("Failed v3");
            }
        })
        .then( function() {
        })
        .thenResolve( 4 );
    })*/
    .done( function() {
        console.log("");
        console.log("Success");
        console.log("");
    });





