let project_folder = require('path').basename(__dirname);
let static_folder = project_folder;
let source_folder = './src';
let fs = require('fs');

let path = {
	build: {
		html: project_folder + '/',
		nunjucks: project_folder + '/nunjucks/',
		css: static_folder + '/static/css/',
		js: static_folder + '/static/js/',
		libs: static_folder + '/static/libs/',
		fonts: static_folder + '/static/fonts/',
		img: static_folder + '/static/img/',
	},
	src: {
		html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
		data: source_folder + '/data.json',
		nunjucks: [source_folder + '/nunjucks/**'],
		nunjucks_files: [source_folder + '/nunjucks/**/*.html', '!' + source_folder + '/nunjucks/**/_*.html', source_folder + '/nunjucks/**/*.njk', '!' + source_folder + '/nunjucks/**/_*.njk'],
		css: [source_folder + '/scss/*.scss', '!' + source_folder + '/scss/_*.scss'],
		js: [source_folder + '/js/*.js', '!' + source_folder + '/js/_*.js'],
		libs: source_folder + '/libs/**',
		fonts_ttf: source_folder + '/fonts/*.ttf',
		fonts_woff: source_folder + '/fonts/*.{woff,woff2}',
		fonts: source_folder + '/fonts/',
		img: source_folder + '/img/**/*.{jpg,jpeg,png,gif,ico,svg,webp}',
		img_folder: source_folder + '/img/',
		sprite: source_folder + '/img/sprite.png',
		sprites: source_folder + '/sprites/*.png',
		spritecss: source_folder + '/scss/',
	},
	watch: {
		html: source_folder + '/**/*.html',
		data: source_folder + '/data.json',
		nunjucks: source_folder + '/nunjucks/**',
		css: source_folder + '/scss/**/*.scss',
		js: source_folder + '/js/**/*.js',
		libs: source_folder + '/libs/**',
		img: source_folder + '/img/**/*.{jpg,jpeg,png,gif,ico,svg,webp}',
		sprites: source_folder + '/sprites/*.png',
	},
	clean: project_folder + '/',
}

let {src, dest} = require('gulp'), 
	gulp = require('gulp'),
	browsersync = require('browser-sync').create(),
	fileinclude = require('gulp-file-include'),
	del = require('del'),
	scss = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	group_media = require('gulp-group-css-media-queries'),
	clean_css = require('gulp-clean-css')
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify-es').default,
	imagemin = require('gulp-imagemin'),
	ttf2woff = require('gulp-ttf2woff'),
	ttf2woff2 = require('gulp-ttf2woff2'),
	normalize = require('node-normalize-scss');
	spritesmith = require('gulp.spritesmith');
	data = require('gulp-data');
	nunjucks = require('gulp-nunjucks');

function browserSync() {
	browsersync.init({
		server: {
			baseDir: './' + project_folder + '/',
		},
		port: 8808,
		notify: false,
	});
}

function watchFiles() {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.nunjucks, path.watch.data], nunjucks_tpl);
	gulp.watch(path.watch.css, css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.libs], libs);
	gulp.watch([path.watch.img], images);
	gulp.watch([path.watch.sprites], sprites);
}

function clean() {
	return del(path.clean);
}

function html() {
	return src(path.src.html)
		.pipe(fileinclude())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream());
}

function _get_json_data(file) {
	if (fs.existsSync(file)) {
		return JSON.parse(fs.readFileSync(file));
	}
	return {};
}

function nunjucks_tpl() {
	src(path.src.nunjucks)
		.pipe(dest(path.build.nunjucks));
	return src(path.src.nunjucks_files)
	        .pipe(data(_get_json_data(path.src.data)))
		.pipe(nunjucks.compile())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream());
}

function css() {
	return src(path.src.css)
		.pipe(
			scss({
				outputStyle: 'expanded',
				includePaths: normalize.includePaths,
			})
		)
		.pipe(group_media())
		.pipe(
			autoprefixer({
				overrideBrowserslist: ['>0.01%', 'not dead', 'not op_mini all'],
				//overrideBrowserslist: ['last 5 versions'],
				cascade: false,
			})
		)
		.pipe(dest(path.build.css))
		.pipe(clean_css())
		.pipe(
			rename({
				extname: '.min.css',
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream());
}

function js() {
	return src(path.src.js)
		.pipe(fileinclude())
		.pipe(dest(path.build.js))
		.pipe(uglify())
		.pipe(
			rename({
				extname: '.min.js',
			})
		)
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream());
}
function libs() {
	return src(path.src.libs)
		.pipe(dest(path.build.libs));
}

function images() {
	return src(path.src.img)
		.pipe(
			imagemin({
				 progressive: true,
				 svgoPlugins: [{removeViewBox: false}],
				 interlaced: true,
				 optimizationLevel: 3,
			})
		)
		.pipe(dest(path.build.img))
		.pipe(browsersync.stream());
}

function sprites() {
	let spriteData = src(path.src.sprites)
		.pipe(
			spritesmith({
				imgName: 'sprite.png',
				cssName: '_sprite.scss',
				imgPath: '/sites/etalon/files/static/img/sprite.png',
				padding: 8,
			})
		);
	spriteData.img.pipe(dest(path.build.img));
	return spriteData.css.pipe(dest(path.src.spritecss));
}

function fonts() {
	src(path.src.fonts_ttf)
		.pipe(dest(path.build.fonts));
	return src(path.src.fonts_woff)
		.pipe(dest(path.build.fonts));
}

function cb() {}

function woffGenerate() {
	del(path.src.fonts_woff)
	src(path.src.fonts_ttf)
		.pipe(ttf2woff())
		.pipe(dest(path.src.fonts));
	console.log('\t   Create woff fonts has been done.');
	console.log('\t   Create woff2 fonts has been done.');
	return src(path.src.fonts_ttf)
		.pipe(ttf2woff2())
		.pipe(dest(path.src.fonts));
}

function scssGenerate(done) {
	fs.writeFile(source_folder + '/scss/_fonts.scss', '', cb);
	console.log('\t   Recreate ' + source_folder + '/scss/_fonts.scss has been done.');
	fs.readdir(path.src.fonts, function (err, items) {
		if (items) {
			for (var i = 0; i < items.length; i++) {
				let fontname = items[i].split('.');
				if (fontname[1] && fontname[1] == 'woff2') {
					fontname = fontname[0];
					fs.appendFile(source_folder + '/scss/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
				}
			}
		}
	});
	done();
}

let build = gulp.series(clean, gulp.parallel(js, libs, css, html, nunjucks_tpl, fonts, images, sprites));
let watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

exports.fontInit = gulp.series(woffGenerate, scssGenerate);
exports.scssGenerate = scssGenerate;
exports.woffGenerate = woffGenerate;
exports.nunjucks_tpl = nunjucks_tpl;
exports.fonts = fonts;
exports.sprites = sprites;
exports.images = images;
exports.js = js;
exports.libs = libs;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
