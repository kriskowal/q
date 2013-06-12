"use strict";

module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-browserify");

    grunt.initConfig({
        browserify: {
            "release/q.umd.js": ["q.js"],
            options: {
                detectGlobals: false, // We don't want it inserting a `process` shim.
                standalone: "Q"       // Creates a "UMD" bundle usable by lots of consumers; name is "Q".
            }
        },
        uglify: {
            "release/q.min.js": ["release/q.umd.js"],
            options: {
                report: "gzip"
            }
        }
    });

    grunt.registerTask("default", ["browserify", "uglify"]);
};
