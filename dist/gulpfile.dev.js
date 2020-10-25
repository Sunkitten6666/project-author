"use strict";

// VARIABLES & PATHS
var preprocessor = 'scss',
    // Preprocessor (sass, scss, less, styl)
fileswatch = 'html,htm,txt,json,md,woff2',
    // List of files extensions for watching & hard reload (comma separated)
imageswatch = 'jpg,jpeg,png,webp,svg',
    // List of images extensions for watching & compression (comma separated)
baseDir = 'app',
    // Base directory path without «/» at the end
online = true; // If «false» - Browsersync will work offline without internet connection

var paths = {
  scripts: {
    src: [// 'node_modules/jquery/dist/jquery.min.js', // npm vendor example (npm i --save-dev jquery)
    baseDir + '/js/app.js' // app.js. Always at the end
    ],
    dest: baseDir + '/js'
  },
  styles: {
    src: baseDir + '/' + preprocessor + '/main.*',
    dest: baseDir + '/css'
  },
  images: {
    src: baseDir + '/images/src/**/*',
    dest: baseDir + '/images/dest'
  },
  deploy: {
    hostname: 'username@yousite.com',
    // Deploy hostname
    destination: 'yousite/public_html/',
    // Deploy destination
    include: [
      /* '*.htaccess' */
    ],
    // Included files to deploy
    exclude: ['**/Thumbs.db', '**/*.DS_Store'] // Excluded files from deploy

  },
  cssOutputName: 'app.min.css',
  jsOutputName: 'app.min.js'
}; // LOGIC

var _require = require('gulp'),
    src = _require.src,
    dest = _require.dest,
    parallel = _require.parallel,
    series = _require.series,
    watch = _require.watch;

var sass = require('gulp-sass');

var scss = require('gulp-sass');

var less = require('gulp-less');

var styl = require('gulp-stylus');

var cleancss = require('gulp-clean-css');

var concat = require('gulp-concat');

var browserSync = require('browser-sync').create();

var uglify = require('gulp-uglify-es')["default"];

var autoprefixer = require('gulp-autoprefixer');

var imagemin = require('gulp-imagemin');

var newer = require('gulp-newer');

var rsync = require('gulp-rsync');

var del = require('del');

function browsersync() {
  browserSync.init({
    server: {
      baseDir: baseDir + '/'
    },
    notify: false,
    online: online
  });
}

function scripts() {
  return src(paths.scripts.src).pipe(concat(paths.jsOutputName)).pipe(uglify()).pipe(dest(paths.scripts.dest)).pipe(browserSync.stream());
}

function styles() {
  return src(paths.styles.src).pipe(eval(preprocessor)()).pipe(concat(paths.cssOutputName)).pipe(autoprefixer({
    overrideBrowserslist: ['last 10 versions'],
    grid: true
  })).pipe(cleancss({
    level: {
      1: {
        specialComments: 0
      }
    }
    /* format: 'beautify' */

  })).pipe(dest(paths.styles.dest)).pipe(browserSync.stream());
}

function images() {
  return src(paths.images.src).pipe(newer(paths.images.dest)).pipe(imagemin()).pipe(dest(paths.images.dest));
}

function cleanimg() {
  return del('' + paths.images.dest + '/**/*', {
    force: true
  });
}

function deploy() {
  return src(baseDir + '/').pipe(rsync({
    root: baseDir + '/',
    hostname: paths.deploy.hostname,
    destination: paths.deploy.destination,
    include: paths.deploy.include,
    exclude: paths.deploy.exclude,
    recursive: true,
    archive: true,
    silent: false,
    compress: true
  }));
}

function startwatch() {
  watch(baseDir + '/' + preprocessor + '/**/*', {
    usePolling: true
  }, styles);
  watch(baseDir + '/images/src/**/*.{' + imageswatch + '}', {
    usePolling: true
  }, images);
  watch(baseDir + '/**/*.{' + fileswatch + '}', {
    usePolling: true
  }).on('change', browserSync.reload);
  watch([baseDir + '/js/**/*.js', '!' + paths.scripts.dest + '/*.min.js'], {
    usePolling: true
  }, scripts);
}

exports.browsersync = browsersync;
exports.assets = series(cleanimg, styles, scripts, images);
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.cleanimg = cleanimg;
exports.deploy = deploy;
exports["default"] = parallel(images, styles, scripts, browsersync, startwatch);