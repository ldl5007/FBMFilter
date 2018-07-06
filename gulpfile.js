const gulp = require('gulp');
const clean = require('gulp-clean');
const ts = require('gulp-typescript');
const run = require('gulp-run');
const sourcemaps = require('gulp-sourcemaps');
const pkg = require('./package.json');
const colors = require('ansi-colors');
const log = require('fancy-log');

const tsProject = ts.createProject('tsconfig.json');

log(colors.yellow('App Name  : '), colors.green.bold(pkg.name));
log(colors.yellow('Version   : '), colors.green.bold(pkg.version));
log(colors.yellow('Entry File: '), colors.green.bold(pkg.main));

gulp.task('clean', function(){
  // Clean up the build directory
  return gulp.src(['./build', './' + pkg.name + '*'])
    .pipe(clean({force: true}));
});

gulp.task('compile-ts', ['clean'], function(){
  const tsResult = gulp.src('src/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(tsProject());

  return tsResult.js
    .pipe(sourcemaps.write('.', {
      includeContent: false
    }))
    .pipe(gulp.dest('build'));
});

gulp.task('move-windows', ['clean'], function(){
  // Copy all other files that are needed over to the build directory
  return gulp.src('./src/app/**/!(*.ts)')
    .pipe(gulp.dest('build/app'));
});

gulp.task('build', ['compile-ts', 'move-windows']);

gulp.task('build-executable', ['compile-ts', 'move-windows'], function(){
  return run('npm run build-app').exec()
});