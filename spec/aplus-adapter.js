"use strict";

var Q = require("../q");

exports.deferred = function(){
	var dfd = Q.defer();
	return {
		promise: dfd.promise,
		resolve: dfd.resolve,
		reject: dfd.reject
	};
};

exports.rejected = function(reason){
	var dfd = Q.defer();
	dfd.reject(reason);
	return dfd.promise;
};

exports.resolved = function(value){
	var dfd = Q.defer();
	dfd.resolve(value);
	return dfd.promise;
};