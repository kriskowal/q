/**
 * Created by Aleksi Asikainen on 8/15/2014.
 *
 * Requires Node
 */
"use strict";

var Q = require("../q");


Q(10)
    .local(function(localData) {
       localData.testValue = 1000;
    })
    .then(function() {
        return Q(30)
            .local(function(localData) {
               /* if( localData.testValue !== 1002 )
                {
                    console.log( localData );
                    throw new Error( 'Failed v4' );
                }*/

                localData.testValue = 1001;
            })
           .thenResolve(4);
    })
    .local(function(localData) {
        if( localData.testValue !== 1001 ) {
            console.error("ErrorLocalData", localData);
            throw new Error("Failed v1");
        }
    })
/*   .then(function() {
        return Q(20).local(function(localData) {
            if( localData.testValue !== 1001 ) {
                console.error("ErrorLocalData", localData);
                throw new Error("Failed v2", localData);
            }
        });
    });*/
    .thenResolve( 49 )
    .then( function() {
        return Q(20)
            .then(function() {
               return 4114;
            });
    })
    .then( function( val ) {
       console.log( val );
    })
   .then(function() {
        var firstQ = Q(20);
        firstQ.__firstQPromise = true;

        var localCall = firstQ
            .then(function() {
              firstQ = firstQ;
            })
            .local(function(localData) {
                if( localData.testValue !== 1001 ) {
                    console.error("ErrorLocalData", localData);
                    throw new Error("Failed v2", localData);
                }

                console.log( "Happy", localData );
            });
            /*.then( function() {
               console.log( "moo" );
            })
            .thenResolve( 4 );*/

        localCall.__localCall = true;

        return localCall;
    })
.done( function() {
        console.log("");
        console.log("Success");
        console.log("");
    });

    //lastPromise.__thisIsLastPromise = true;

/*    .done( function() {
        console.log("");
        console.log("Success");
        console.log("");
    });*/









