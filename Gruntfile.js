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
    jsdoc: {
      all: {
        src: [
          'README.md',
          'src/modules/',
          'src/vowelworm.js'
        ],
        dest: 'doc/',
        options: {
          'verbose': true,
          'recurse': true,
          'private': false
        }
      }
    },
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
      demo: { // for Github pages
        TEMPCompilerOpts: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS'
        },
        src: config.all_js_concat_output,
        dest: release_dir + 'vowelworm-demo.min.js'
      },
      main: {
        files: [
          {
            expand: true,
            src: [
              'src/vowelworm.js',
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
      demo: {
        src: [
          'src/vowelworm.js',
          'src/modules/core/vowelworm.game.js',
          'main.js'
        ],
        dest: config.all_js_concat_output
      }
    },
    clean: [output_dir, 'src/modules/**/*.min.js', 'src/vowelworm.min.js']
  });
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-closure-tools');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('test', 'qunit');
  grunt.registerTask('doc', 'jsdoc');
  grunt.registerTask('compile-demo', ['concat:demo','closureCompiler:demo']);
  grunt.registerTask('compile', ['clean', 'closureCompiler:main', 'concat:main', 'closureCompiler:all']);
  grunt.registerTask('default', ['test','compile','compile-demo','doc']);
};
