"use strict";

module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.initConfig({
        uglify: {
            options: {
                report: "gzip"
            },
            dist: {
                files: {
                    "q.min.js": ["q.js"]
                }
            }
        }
    });

    grunt.registerTask("default", ["uglify"]);
};
