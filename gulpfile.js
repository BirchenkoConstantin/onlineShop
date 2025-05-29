const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-dart-sass');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const avif = require('gulp-avif');
const plumber = require('gulp-plumber');
const fileInclude = require('gulp-file-include');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
const newer = require('gulp-newer');
const fonter = require('gulp-fonter');
const ttf2woff2 = require('gulp-ttf2woff2');
const fs = require('fs').promises;
const path = require('path');

const paths = {
  html: {
    src: 'page/**/*.html',
    watch: ['components/**/*.html', 'page/**/*.html'],
    dest: 'dist/',
  },
  styles: {
    src: 'scss/main.scss',
    dest: 'dist/css/',
  },
  scripts: {
    src: 'js/main.js',
    dest: 'dist/js/',
  },
  images: {
    src: 'image/src/**/*.{jpg,jpeg,png}',
    svg: 'image/src/**/*.svg',
    dest: 'dist/image/',
  },
  fonts: {
    src: 'fonts/src/**/*.{ttf,otf,woff,woff2}',
    dest: 'dist/fonts/',
  },
};

// Очистка dist
function clean() {
  const distPath = path.resolve('dist');
  return fs.rm(distPath, { recursive: true, force: true })
    .then(() => console.log('Папка dist успешно удалена'))
    .catch((err) => console.error('Ошибка при удалении dist:', err));
}

// HTML
function html() {
  return src(paths.html.src)
    .pipe(fileInclude({
      prefix: '@@',
      basepath: 'components/',
    }))
    .pipe(dest(paths.html.dest))
    .pipe(browserSync.stream());
}

// SCSS
function styles() {
  return src(paths.styles.src)
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

// JS
function scripts() {
  return src(paths.scripts.src)
    .pipe(plumber())
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

// Images
function images() {
  return src(paths.images.src, { base: 'image/src', allowEmpty: true }) // сохраняем структуру от image/src
    .pipe(newer(paths.images.dest))
    .pipe(avif({ quality: 95 }))
    .pipe(dest(paths.images.dest)) // всё равно в dist/image, но структура внутри сохранится
    .pipe(browserSync.stream());
}

//SVG
function svg() {
  return src(paths.images.svg, { base: 'image/src', allowEmpty: true })
    .pipe(newer(paths.images.dest))
    .pipe(dest(paths.images.dest))
    .pipe(browserSync.stream());
}

// Fonts
function fonts() {
  return src(paths.fonts.src)
    .pipe(plumber())
    .pipe(fonter({ formats: ['woff'] }))
    .pipe(dest(paths.fonts.dest))
    .pipe(src(paths.fonts.src))
    .pipe(ttf2woff2())
    .pipe(dest(paths.fonts.dest));
}

// Локальний сервер
function serve() {
  browserSync.init({
    server: {
      baseDir: 'dist/',
    },
    notify: false,
    open: true,
  });

  watch(paths.html.watch, html);
  watch(paths.styles.src, styles);
  watch(paths.scripts.src, scripts);
  watch(paths.images.src, images);
  watch(paths.fonts.src, fonts);
}

exports.clean = clean;
exports.html = html;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.fonts = fonts;
exports.serve = serve;

exports.default = series(
  clean,
  parallel(html, styles, scripts, images, svg, fonts),
  serve
);