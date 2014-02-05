
var
  gulp = require('gulp'),
  fs = require('fs'),
  gutil = require('gulp-util'),
  map = require('vinyl-map'),
  sass = require('gulp-ruby-sass'),
  jade = require('gulp-jade'),
  pureJade = require('jade'),
  frontMatter = require('front-matter'),
  marked = require('marked'),
  autoprefixer = require('gulp-autoprefixer'),
  minifycss = require('gulp-minify-css'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  imagemin = require('gulp-imagemin'),
  rename = require('gulp-rename'),
  clean = require('gulp-clean'),
  concat = require('gulp-concat'),
  notify = require('gulp-notify'),
  cache = require('gulp-cache'),
  connect = require('connect'),
  http = require('http'),
  openurl = require('open'),
  livereload = require('gulp-livereload'),
  tinylr = require('tiny-lr'),
  lrServer = tinylr();


var
  paths = {
    js: 'src/js/**/*.js',
    scss: 'src/scss/**/*.scss'
  },
  serverConfig = {
    app: 'src',
    dist: 'dist',
    port: 9000
  },
  lrConfig = {
    port: 35729
  };


/**
 * primary content
 */

// static pages
gulp.task('jade', function () {
  return gulp.src('src/jade/**/*.jade')
    .pipe(jade())
    .pipe(gulp.dest('dist'))
    .pipe(livereload(lrServer));
});


gulp.task('blog', function (cb) {

  var
    tpl = fs.readFileSync('src/templates/post.jade'),
    jadeTpl = pureJade.compile(tpl),
    renderPost = map(function(code, filename) {
      // .attributes .body
      var parsed = frontMatter(String(code)),
          data = parsed.attributes,
          body = parsed.body;

      body = marked.parse(body);

      data.content = body;
      data.filename = filename;

      return jadeTpl(data);
    });

  return gulp.src('src/blog/*.md')
    .pipe(renderPost)
    .pipe(rename({ext: '.html'}))
    .pipe(gulp.dest('dist/blog'))
    .pipe(livereload(lrServer));
});


gulp.task('scripts', function () {
  return gulp.src(paths.js)
    // .pipe(concat('dest.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(livereload(lrServer));
});

gulp.task('styles', function () {
  return gulp.src(paths.scss)
    .pipe(sass({ style: 'expanded' }))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('dist/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/css'))
    .pipe(livereload(lrServer))
    .pipe(notify({ message: 'Styles task complete' }));
});

gulp.task('images', function() {
  return gulp.src('src/img/**/*')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('dist/assets/img'))
    .pipe(livereload(lrServer))
    .pipe(notify({ message: 'Images task complete' }));
});


/**
 * building and serving
 */
gulp.task('clean', function() {
  return gulp.src(['dist/*'], {read: false})
    .pipe(clean());
});


gulp.task('watch', function() {
  gulp.watch('src/jade/**/*.jade', ['jade']);
  gulp.watch('src/blog/*.md', ['blog']);
  gulp.watch('src/scss/**/*.scss', ['styles']);
  gulp.watch('src/js/**/*.js', ['scripts']);
  gulp.watch('src/img/**/*', ['images']);
});


gulp.task('server', ['build'], function() {

  var middleware = [
    require('connect-livereload')({ port: lrConfig.port }),
    connect.static(serverConfig.dist),
    connect.directory(serverConfig.dist)
  ];

  var app = connect.apply(null, middleware),
      server = http.createServer(app);

  server
    .listen(serverConfig.port)
    .on('listening', function() {

        gulp.start('watch');

        console.log('Started connect web server on http://localhost:' + serverConfig.port + '.');
        openurl('http://localhost:' + serverConfig.port);
    });

  lrServer.listen(lrConfig.port, function(err) {
    if(err) {
      return console.log(err);
    }
  });
});


gulp.task('build', ['clean'], function(cb) {
  // not correct, it needs to do the callback after these are done
  gulp.start('jade', 'blog', 'styles', 'scripts', 'images');
  cb();
});

gulp.task('default', ['server']);

