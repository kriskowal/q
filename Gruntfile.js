"use strict";

var fs = require("fs");

module.exports = function (grunt) {
    ["grunt-contrib-uglify", "grunt-contrib-requirejs", "grunt-browserify"]
        .forEach(grunt.loadNpmTasks);

    grunt.registerTask("create-global-entry", function () {
        fs.writeFileSync("q-global.js", "window.Q = require(\"./q\");");
    });
    grunt.registerTask("delete-global-entry", function () {
        fs.unlinkSync("q-global.js");
    });

    grunt.initConfig({
        requirejs: {
            compile: {
                options: {
                    cjsTranslate: true,
                    out: "release/q.amd.js",
                    optimize: "none",
                    include: ["q"]
                }
            }
        },
        browserify: {
            "release/q.js": ["q-global.js"],
            options: {
                detectGlobals: false // don't detect and insert a `process` shim.
            }
        },
        uglify: {
            "release/q.amd.min.js": ["release/q.amd.js"],
            "release/q.min.js": ["release/q.js"],
            options: {
                report: "gzip"
            }
        }
    });

    grunt.registerTask("default", [
        "requirejs",
        "create-global-entry",
        "browserify",
        "delete-global-entry",
        "uglify"
    ]);
};
