import { src, dest, watch, series, parallel } from 'gulp';
import sass from 'gulp-dart-sass';  // Используем gulp-dart-sass вместо gulp-sass
import cleanCSS from 'gulp-clean-css';
import uglify from 'gulp-uglify';
import avif from 'gulp-avif';
import plumber from 'gulp-plumber';
import fileInclude from 'gulp-file-include';
import rename from 'gulp-rename';
import browserSync from 'browser-sync';
import newer from 'gulp-newer';
import { promises as fs } from 'fs';  // Используем fs.promises для работы с файлами
import path from 'path';
import fonter from 'gulp-fonter';
import ttf2woff2 from 'gulp-ttf2woff2';

// Пути
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
    dest: 'dist/image/',
  },
  fonts: {
    src: 'fonts/src/**/*.{ttf,otf,woff,woff2}',
    dest: 'dist/fonts/',
  },
};

// Очистка dist
async function clean() {
  try {
    const distPath = path.resolve('dist');
    await fs.rm(distPath, { recursive: true, force: true });  // Используем fs.promises.rm
    console.log('Папка dist успешно удалена');
  } catch (err) {
    console.error('Ошибка при удалении dist:', err);
  }
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
    .pipe(plumber())  // Добавляем обработку ошибок
    .pipe(sass().on('error', sass.logError))  // Используем правильный подход для компиляции SCSS
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
  return src(paths.images.src, { allowEmpty: true })  // Добавляем allowEmpty
    .pipe(newer(paths.images.dest))
    .pipe(avif({ quality: 95 }))
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

// Локальный сервер
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

// Сборка
export { clean, html, styles, scripts, images, fonts, serve };

export default series(
  clean,
  parallel(html, styles, scripts, images, fonts),
  serve
);
