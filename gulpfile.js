const gulp = require('gulp');
const tasks = require('gulp-task-listing');
const log = require('fancy-log');
const del = require('del');

function output() {
  var fs = require('fs');
  if (fs.existsSync('../hubot')) {
      return '../hubot/scripts';
  }

  if (fs.existsSync('./hubot')) {
      return './hubot/scripts';
  }

  return 'dist';
}

function templates() {
  const dir = output();
  log('Copying templates to', dir);
  return gulp.src('src/**/*.html').pipe(gulp.dest(dir))
}

function build() {
  const dir = output();
  log('Copying javascript to', dir);
  return gulp.src('src/**/*.js').pipe(gulp.dest(dir));
}

function watchFiles() {
  gulp.watch("src/**/*.js", build);
}

gulp.task('clean', function() {
  const dir = output();
  log('Removing destination', dir);
  return del([dir], {force:true});
});

gulp.task('templates', gulp.series('clean', function() { return templates(); }));

gulp.task('build', gulp.series('templates', function() { return build(); }));

gulp.task('watch', gulp.series('build', function () { return watchFiles(); }));

gulp.task('help', tasks);
