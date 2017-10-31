const gulp = require('gulp');
const tasks = require('gulp-task-listing');
const util = require('gulp-util');
const del = require('del');

// Add a task to render registered tasks when user types 'gulp help'
gulp.task('help', tasks);
gulp.task('default', ['help']);

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
  util.log('Copying templates to', dir);
  return gulp.src('src/**/*.html').pipe(gulp.dest(dir))
}

function build() {
  const dir = output();
  util.log('Copying javascript to', dir);
  return gulp.src('src/**/*.js').pipe(gulp.dest(dir));
}

gulp.task('clean', function() {
  const dir = output();
  util.log('Removing destination', dir);
  return del([dir], {force:true});
});

gulp.task('templates', ['clean'], templates);
gulp.task('build', ['templates'], function() { return build(); });
gulp.task('watch', ['build'], function () {
   gulp.watch('src/**/*.js', ['build']);
});
