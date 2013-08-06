"use strict";

var fs = require("fs");

module.exports = function (grunt) {
    ["grunt-contrib-uglify",
     "grunt-contrib-clean",
     "grunt-amd-wrap",
     "grunt-global-wrap"]
        .forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        clean: {
            artifacts: ["release/"]
        },
        amdwrap: {
            artifacts: {
                expand: true,
                src: ["q.js", "queue.js"],
                dest: "release/amd/"
            }
        },
        globalwrap: {
            artifacts: {
                main: "q.js",
                global: "Q",
                dest: "release/q.js",

                // don't detect and insert a `process` shim.
                bundleOptions: { detectGlobals: false }
            }
        },
        uglify: {
            artifacts: {
                files: [{
                    expand: true,
                    cwd: "release/",
                    src: ["**/*.js"],
                    dest: "release/",
                    ext: ".min.js"
                }],
                options: {
                    report: "gzip"
                }
            }
        }
    });

    grunt.registerTask("default", ["clean", "amdwrap", "globalwrap", "uglify"]);
};
