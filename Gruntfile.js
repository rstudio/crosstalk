module.exports = function (grunt) {
  grunt.initConfig({
    babel: {
      options: {
        sourceMap: true,
        presets: ["es2015"],
        plugins: ["transform-es2015-modules-commonjs"]
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'javascript/src',
          src: ['**/*.js'],
          dest: 'inst/www/js',
          ext:'.js'
        }]
      },
      distSpecs: {
        files: [{
          expand: true,
          cwd: 'javascript/tests',
          src: ['**/*.js'],
          dest: 'inst/www/js',
          ext:'.js'
        }]
      }
    },
    browserify: {
      options: {
        browserifyOptions: {
          //debug: true
        }
      },
      dist: {
        files: {
          // if the source file has an extension of es6 then
          // we change the name of the source file accordingly.
          // The result file's extension is always .js
          "./inst/www/js/crosstalk.js": ["./inst/www/js/index.js"]
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
          require: ["babel-register", "source-map-support/register"],
          // captureFile: 'results.txt', // Optionally capture the reporter output to a file
          quiet: false, // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
        },
        src: ["inst/www/js/**/test-*.js"]
      }
    },
    watch: {
      scripts: {
        files: ["./javascript/src/**/*.js", "javascript/tests/**/*.js"],
        tasks: ["babel", "browserify", "eslint", "mochaTest"]
      }
    },
    jsdoc: {
      dist: {
        src: ['javascript/src/**/*.js'],
        options: {
          destination: 'doc',
          template: "node_modules/ink-docstrap/template",
          configure: "node_modules/ink-docstrap/template/jsdoc.conf.json"
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-babel");
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-jsdoc");
  grunt.loadNpmTasks("grunt-mocha-test");

  grunt.registerTask("default", ["watch"]);
  grunt.registerTask("build", ["babel", "browserify", "eslint", "mochaTest"]);
};
