"use strict";

var fs = require("fs");
var path = require("path");

module.exports = function (grunt) {
    ["grunt-contrib-uglify",
     "grunt-contrib-clean",
     "grunt-amd-wrap",
     "grunt-global-wrap",
     "grunt-s3"]
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
        },
        s3: {
            artifacts: {
                options: {
                    bucket: "q-releases",
                    access: "public-read",
                    region: "us-west-1",
                    key: process.env.S3_KEY,
                    secret: process.env.S3_SECRET
                },
                upload: [{
                    // See https://github.com/pifantastic/grunt-s3/issues/91 for
                    // why we use this funky syntax instead of the standard.
                    src: "release/**/*.js",
                    rel: path.basename(path.resolve(__dirname, "release"))
                }]
            }
        }
    });

    grunt.registerTask("pre-browser-test", ["clean", "globalwrap"]);
    grunt.registerTask("release", ["clean", "amdwrap", "globalwrap", "uglify", "s3"]);
};
