"use strict";

var fs = require("fs");
var path = require("path");

var refPattern = /^ref: (.*)$/;
function followGitRef(ref) {
    var match = refPattern.exec(ref);
    if (match) {
        var refPath = path.resolve(__dirname, ".git", match[1]);
        if (fs.existsSync(refPath)) {
            return followGitRef(fs.readFileSync(refPath, "ascii").trim());
        }
    } else {
        return ref;
    }
}

// compute a release name for S3 based on the version in package.json and
// whether the git HEAD matches the tag for the corresponding version
var config = require("./package.json");
var headHash = followGitRef("ref: HEAD");
var versionHash = followGitRef("ref: refs/tags/v" + config.version);

var releasePath;
if (headHash === versionHash) {
    releasePath = config.version;
} else {
    releasePath = "commits/" + headHash;
}

console.log("release path: %j", releasePath);

module.exports = function (grunt) {
    ["grunt-contrib-uglify",
     "grunt-contrib-clean",
     "grunt-amd-wrap",
     "grunt-global-wrap",
     "grunt-s3"]
        .forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        releasePath: releasePath,
        clean: {
            artifacts: ["release/"]
        },
        amdwrap: {
            artifacts: {
                expand: true,
                src: ["q.js", "queue.js"],
                dest: "release/<%= releasePath %>/amd/"
            }
        },
        globalwrap: {
            artifacts: {
                main: "q.js",
                global: "Q",
                dest: "release/<%= releasePath %>/q.js",

                // don't detect and insert a `process` shim.
                bundleOptions: { detectGlobals: false }
            }
        },
        uglify: {
            artifacts: {
                files: [{
                    expand: true,
                    cwd: "release/<%= releasePath %>/",
                    src: ["q.js"],
                    dest: "release/<%= releasePath %>/",
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

    grunt.registerTask("build", ["clean", "amdwrap", "globalwrap", "uglify"]);
    grunt.registerTask("release", ["clean", "amdwrap", "globalwrap", "uglify", "s3"]);
};
