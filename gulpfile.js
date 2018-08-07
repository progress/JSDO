var gulp = require('gulp');
var minify = require('gulp-minify');
var sequence = require('gulp-sequence');
var concat = require('gulp-concat');
var del = require('del');
var typescript = require('gulp-typescript');
var rename = require('gulp-rename');

/* JSDO Source Library tasks */

gulp.task('cleanup', function (done) {
    del(['lib/*']).then(function () {
        return del([
            'packages/core/lib/*',
            'packages/nativescript/lib/*',
            'packages/node/lib/*'
        ])
    }).then(function() { done(); })
        .catch(function (err) { done(err); })
});

gulp.task('minify', function () {
    return gulp.src(['lib/*.js'])
        .pipe(minify({
            ext: {
                min: '.min.js'
            },
            noSource: false,
            output: {
                source_map: true
            }
        }))
        .pipe(gulp.dest('lib'));
});

gulp.task('concat all', function () {
    return gulp.src([
        'src/progress.util.js',
        'src/progress.js',
        'src/auth/progress.auth.js',
        'src/auth/progress.auth.basic.js',
        'src/auth/progress.auth.form.js',
        'src/auth/progress.auth.sso.js',
        'src/progress.session.js',
        'src/progress.data.kendo.js'
    ]).pipe(concat('progress.all.js'))
        .pipe(gulp.dest('lib/'));
});

gulp.task('concat jsdo', function () {
    return gulp.src([
        'src/progress.util.js',
        'src/progress.js',
        'src/auth/progress.auth.js',
        'src/auth/progress.auth.basic.js',
        'src/auth/progress.auth.form.js',
        'src/auth/progress.auth.sso.js',
        'src/progress.session.js',
    ]).pipe(concat('progress.jsdo.js'))
        .pipe(gulp.dest('lib/'));
});

gulp.task('build jsdo', sequence('cleanup', 'concat all', 'concat jsdo', 'minify'));

/* Core package tasks */

gulp.task('concat core', function () {
    return gulp.src(['lib/progress.jsdo.js'])
        .pipe(rename('progress.core.js'))
        .pipe(gulp.dest('packages/core/lib/'));
});

gulp.task('core typings', function () {
    return gulp.src(['typings/*']).pipe(rename('progress.core.d.ts')).pipe(gulp.dest('packages/core/typings'));
});

gulp.task('core license', function () {
    return gulp.src(['LICENSE', 'notice.txt']).pipe(gulp.dest('packages/core'));
});

gulp.task('build core', sequence('build jsdo', 'concat core', 'core typings', 'core license'));

/* Angular Data Source package tasks */

gulp.task('compile ng', function () {
    return gulp.src(['packages/ng-datasource/src/progress.data.ng.ds.ts']).pipe(typescript.createProject({
        experimentalDecorators: true,
        module: 'commonjs',
        target: 'es5',
        lib: ['es2017', 'dom']
    })()).pipe(gulp.dest('packages/ng-datasource/src/'));
});

gulp.task('package ng', function () {
    return gulp.src(['packages/ng-datasource/src/progress.data.ng.ds.js']).pipe(rename('progress.data.angular.js')).pipe(gulp.dest('packages/angular/lib/'));
});

gulp.task('ng typings', function () {
    return gulp.src(['packages/ng-datasource/typings/progress.data.ng.ds.d.ts']).pipe(rename('progress.data.angular.d.ts')).pipe(gulp.dest('packages/angular/typings/'));
});

gulp.task('ng license', function () {
    return gulp.src(['LICENSE', 'notice.txt']).pipe(gulp.dest('packages/angular'));
});

gulp.task('build ng', sequence('compile ng', 'package ng', 'ng typings', 'ng license'));

/* NativeScript Data Source package tasks */

gulp.task('concat ns', function () {
    return gulp.src([
        'packages/nativescript/src/loaddep.js',
        'packages/ng-datasource/src/progress.data.ng.ds.js'
    ]).pipe(concat('progress.data.ns.js'))
        .pipe(gulp.dest('packages/nativescript/lib/'));
});

gulp.task('ns typings', function () {
    return gulp.src(['packages/ng-datasource/typings/progress.data.ng.ds.d.ts']).pipe(rename('progress.data.ns.d.ts')).pipe(gulp.dest('packages/nativescript/typings/'));
});

gulp.task('ns license', function () {
    return gulp.src(['LICENSE', 'notice.txt']).pipe(gulp.dest('packages/nativescript'));
});

gulp.task('build ns', sequence('compile ng', 'concat ns', 'ns typings', 'ns license'));

/* node.js Data Source package tasks */

gulp.task('concat node', function () {
    return gulp.src([
        'packages/node/src/loaddep.js',
        'packages/ng-datasource/src/progress.data.ng.ds.js'
    ]).pipe(concat('progress.data.node.js'))
        .pipe(gulp.dest('packages/node/lib/'));
});

gulp.task('node typings', function () {
    return gulp.src(['packages/ng-datasource/typings/progress.data.ng.ds.d.ts']).pipe(rename('progress.data.node.d.ts')).pipe(gulp.dest('packages/node/typings/'));
});

gulp.task('node license', function () {
    return gulp.src(['LICENSE', 'notice.txt']).pipe(gulp.dest('packages/node'));
});

gulp.task('build node', sequence('compile ng', 'concat node', 'node typings', 'node license'));



//build all
gulp.task('build all', sequence('build core', 'build ng', 'concat ns', 'ns typings', 'ns license', 'build ns', 'concat node', 'node typings', 'node license'));


