"use strict";

var fs = require("fs");
var path = require("path");

// compute a release name for S3 based on the version in package.json and
// whether the git HEAD matches the tag for the corresponding version
var config = require("./package.json");
var headPath = path.resolve(__dirname, ".git", "HEAD");
var tagPath = path.resolve(__dirname, ".git", "refs", "tags", "v" + config.version);
var releaseName;
if (fs.existsSync(headPath)) {
    var headHash = fs.readFileSync(headPath, "ascii").trim();
    if (fs.existsSync(tagPath)) {
        var tagHash = fs.readFileSync(tagPath, "ascii").trim();
        if (tagHash === headHash) {
            releaseName = config.version;
        } else {
            releaseName = headHash;
        }
    } else {
        releaseName = headHash;
    }
} else {
    releaseName = "default";
}

module.exports = function (grunt) {
    ["grunt-contrib-uglify",
     "grunt-contrib-clean",
     "grunt-amd-wrap",
     "grunt-global-wrap",
     "grunt-s3"]
        .forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        releaseName: releaseName,
        clean: {
            artifacts: ["release/"]
        },
        amdwrap: {
            artifacts: {
                expand: true,
                src: ["q.js", "queue.js"],
                dest: "release/<%= releaseName %>/amd/"
            }
        },
        globalwrap: {
            artifacts: {
                main: "q.js",
                global: "Q",
                dest: "release/<%= releaseName %>/q.js",

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
