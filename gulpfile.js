// gulp
var gulp = require("gulp");

// regular usage
var copy = require("gulp-copy");
var concat = require("gulp-concat");
var browser = require("browser-sync");
var plumber = require("gulp-plumber");
var watch = require("gulp-watch");

// for js
var webpack = require('gulp-webpack');
var named = require('vinyl-named');
var uglify = require("gulp-uglify");

// for css
var sass = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");

// for template
var ejs = require("gulp-ejs");

// パス管理
var paths = {
  js : {
    src         : "./src/js",
    dest        : "./htdocs/js",
    files       : "/**/*.js",
    ignorefiles : ["/lib/**/*.js"],
    lib         : "lib"
  },
	styles : {
    src      : "./src/sass",
    dest     : "./htdocs/css",
    files    : "/**/*.scss",
    mainfile : "style.css",
    lib      : "lib"
	},
  templates : {
    src      : "./src/template",
    files    : "/**/*.ejs",
    dest     : "./htdocs"
  },
  // watch時に変更が合ったらbrowser.reloadする対象
  watchfiles : [
    // "./htdocs/**/*.html"
  ]
};

paths.js.target = [];
paths.js.target.push(paths.js.src + paths.js.files);
for (var i=0;i<paths.js.ignorefiles.length;i++) {
  paths.js.target.push("!" + paths.js.src + paths.js.ignorefiles[i]);
}
paths.js.webpackEntry = paths.js.target.concat([ "!" + paths.js.src + "/**/_*.js" ]); // _*.jsはrequire用モジュールのためentryしない
// console.log(paths.js.target);

paths.templates.target = [];
paths.templates.target.push(paths.templates.src + paths.templates.files);
paths.templates.ejsEntry = paths.templates.target.concat([ "!" + paths.templates.src + "/**/_*.ejs" ]); // _*.ejsはinclude用モジュールのためentryしない

// webpackの設定
var config = {
  webpack: {
    // entry: paths.js.webpackEntry,
    // output: {
      // path: paths.js.dest,
      // filename: "[name].js"
    // },
    // plugins: [
    //     new webpack.optimize.CommonsChunkPlugin('app','app.js')
    // ]
    resolve: {
      extensions: ['', '.js']
    },
    module: {},
  }
}

// library系ファイルをsrc配下からhtdocs配下へコピー
gulp.task("copy-lib-js", function(){
  gulp.src([paths.js.src + "/" + paths.js.lib + "/**/*"], { base : paths.js.src })
    .pipe(plumber())
    .pipe(gulp.dest(paths.js.dest));
});

gulp.task("copy-lib-css", function(){
  gulp.src([paths.styles.src + "/" + paths.styles.lib + "/**/*"], { base : paths.styles.src })
    .pipe(plumber())
    .pipe(gulp.dest(paths.styles.dest));
});

gulp.task("copy", function(){
  gulp.start("copy-lib-js");
  gulp.start("copy-lib-css");
})

// jsのuglify
gulp.task("js", function() {
  // gulp.src([paths.js.src + paths.js.files, paths.js.src + paths.js.ignorefiles])
  gulp.src(paths.js.webpackEntry)
    .pipe(plumber())
    .pipe(named())
    .pipe(webpack(config.webpack))
    // .pipe(uglify({
    //   mangle : false,
    //   compress : false,
    //   preserveComments : 'some'
    // }))
    .pipe(gulp.dest(paths.js.dest))
    .pipe(browser.reload({stream:true}));
});

// sassのコンパイルと結合 + style guide用css更新
gulp.task("sass", function() {
  gulp.src(paths.styles.src + paths.styles.files)
    .pipe(plumber())
    .pipe(concat(paths.styles.mainfile))
    .pipe(sass({
      // outputStyle : "compressed"
    }))
    .pipe(autoprefixer('last 4 version'))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browser.reload({stream:true}));
});

// ejs -> htmlへの変換
gulp.task("ejs", function() {
  gulp.src(paths.templates.ejsEntry)
  .pipe(plumber())
    .pipe(ejs())
    .pipe(gulp.dest(paths.templates.dest))
    .pipe(browser.reload({stream:true}));
});

// default gulpタスク設定
gulp.task("default", function() {
  gulp.start('copy', 'ejs', 'sass', 'js');
});

// browserSync用サーバ立ち上げ
gulp.task("server", function() {
  browser({
    server: {
      baseDir: "./htdocs/"
    }
  });
});

// browserSyncで立ち上げたページをリロード
gulp.task("reload", function() {
  browser.reload();
});

// file監視
gulp.task("watch", ["server"], function() {
  watch(paths.js.target, function(){gulp.start("js")});
  watch(paths.styles.src + paths.styles.files, function(){gulp.start("sass")});
  watch(paths.templates.target, function(){gulp.start("ejs")});
  watch([paths.js.src + "/" + paths.js.lib + "/**/*", paths.styles.src + "/" + paths.styles.lib + "/**/*"], function(){gulp.start("copy")})
  // watch(paths.watchfiles, ["reload"]);
  watch([paths.styles.src + "/" + paths.styles.lib + "/**/*"], function(){gulp.start("copy-lib-css")});
  watch([paths.js.src + "/" + paths.js.lib + "/**/*"], function(){gulp.start("copy-lib-js")});

});
