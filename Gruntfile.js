module.exports = function(grunt) {
  var output_dir = './out/';
  var build_dir = output_dir + 'build/';
  var release_dir = output_dir + 'release/';

  var config = {
    all_js_concat_output: build_dir + 'concat.js',
    main_concat_output: build_dir + 'main-concat.js'
  };
  
  var compiler = require('superstartup-closure-compiler');

  grunt.initConfig({
    qunit: {
      all: ['test/index.html']
    },
    markdown: {
      readme: {
        files: [{
          src: 'README.md',
          dest: 'README.html'
        }],
        options: {
          markdownOptions: {
            highlight: 'manual',
            gfm: true
          }
        }
      }
    },
    replace: {
      readme: {
        src: 'README.html',
        dest: 'README.html',
        replacements: [{
          from: 'https://byu-odh.github.io/apeworm/',
          to: ''
        }]
      }
    },
    // grunt-jsdoc won't work until it updates to version 3.3.0 of JSDoc
    /*jsdoc: {
      all: {
        src: [
          'src/modules/',
          'src/vowelworm.js'
        ],
        dest: 'doc/',
        options: {
          verbose: true,
          recurse: true,
          'private': false
        }
      }
    },*/
    closureCompiler: {
      options: {
        create_source_map: null,
        compilerFile: compiler.getPath(),
        compilerOpts: {
          compilation_level: 'SIMPLE_OPTIMIZATIONS',
          language_in: 'ECMASCRIPT5',
          externs: grunt.file.expand(['src/lib/externs/**/*.js']),
          warning_level: 'verbose',
          output_wrapper: '"(function(){%output%}).call(this);"',
          jscomp_off: ['nonStandardJsDocs']
        },
        execOpts: {
          maxBuffer: 5000 * 1024
        },
        TieredCompilation: true,
      },
      core:{ // for vowelworm.js
        TEMPcompilerOpts: {
          externs: grunt.file.expand(['src/lib/externs/**/*.js','!src/lib/externs/vowelworm.externs.js'])
        },
        src: ['src/vowelworm.js'],
        dest: release_dir + 'vowelworm.min.js'
      },
      modules: {
        files: [
          {
            expand: true,
            src: [
              'src/modules/**/*.js',
              '!src/modules/**/*.min.js'
            ],
            ext: '.min.js',
            extDot: 'last',
            rename: function(dest, matchedSrcPath, options) {
              // puts the compiled files in the release directory
              return matchedSrcPath.replace(/^src/, release_dir);
            }
          }
        ],
      },
      all: {
        TEMPcompilerOpts: {
          externs: grunt.file.expand(['src/lib/externs/**/*.js','!src/lib/externs/vowelworm.externs.js'])
        },
        src: config.main_concat_output,
        dest: release_dir + 'vowelworm.complete.min.js'
      }
    },
    concat: {
      main: {
        src: [
          'src/vowelworm.js',
          'src/modules/**/*.js'
        ],
        dest: config.main_concat_output
      },
    },
    clean: {
      src: [output_dir, 'src/modules/**/*.min.js', 'src/vowelworm.min.js'],
      doc: ['doc','README.html']
    },
    exec: {
      jsdoc: {
        cmd: 'node_modules/jsdoc/jsdoc.js ' +
             'src/vowelworm.js ' +
             'src/modules/ ' +
             '--template node_modules/jaguarjs-jsdoc ' +
             '--recurse ' +
             '--destination doc/ ' +
             '--verbose '
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-closure-tools');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-markdown');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('test', 'qunit');
  grunt.registerTask('doc', ['clean:doc', 'exec:jsdoc', 'markdown', 'replace:readme']);
  grunt.registerTask('compile', ['clean:src', 'closureCompiler:modules', 'closureCompiler:core','compile:complete']);
  grunt.registerTask('compile:complete', ['clean:src', 'concat:main', 'closureCompiler:all']);
  grunt.registerTask('default', ['test','compile','doc']);
};
