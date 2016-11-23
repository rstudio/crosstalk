module.exports = function (grunt) {
  grunt.initConfig({
    browserify: {
      options: {
        browserifyOptions: {
          debug: true
        }
      },
      dist: {
        options: {
          transform: [
            ["babelify", {
            }]
          ]
        },
        files: {
          // if the source file has an extension of es6 then
          // we change the name of the source file accordingly.
          // The result file's extension is always .js
          "./inst/www/js/crosstalk.js": ["./javascript/src/index.js"]
        }
      }
    },
    exorcise: {
      bundle: {
        options: {},
        files: {
          "./inst/www/js/crosstalk.js.map": ["./inst/www/js/crosstalk.js"]
        }
      }
    },
    uglify: {
      options: {
        sourceMapIn: "./inst/www/js/crosstalk.js.map",
        sourceMap: true
      },
      index: {
        files: {
          "./inst/www/js/crosstalk.min.js": ["./inst/www/js/crosstalk.js"]
        }
      }
    },
    eslint: {
      target: ["./javascript/**/*.js"]
    },
    mochaTest: {
      test: {
        options: {
          reporter: "spec",
          require: ["babel-register"],
          // captureFile: 'results.txt', // Optionally capture the reporter output to a file
          quiet: false, // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
        },
        src: ["./javascript/tests/**/*.js"]
      }
    },
    watch: {
      scripts: {
        files: ["./javascript/src/**/*.js", "javascript/tests/**/*.js"],
        tasks: ["build"]
      }
    },
    jsdoc: {
      dist: {
        src: ["package.json", "javascript/src/**/*.js"],
        options: {
          destination: "doc",
          configure: "jsdoc.conf.json",
          //template: "node_modules/ink-docstrap/template",
          //configure: "node_modules/ink-docstrap/template/jsdoc.conf.json"
          tutorials: "javascript/tutorials"
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-exorcise");
  grunt.loadNpmTasks("grunt-jsdoc");
  grunt.loadNpmTasks("grunt-mocha-test");

  grunt.registerTask("test", ["mochaTest", "eslint"]);
  grunt.registerTask("build", ["test", "browserify", "exorcise", "uglify"]);
  grunt.registerTask("default", ["build"]);
};
