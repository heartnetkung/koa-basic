const globalVar = require('./globalvar');
const koa = require('koa');
const router = require('koa-router')();
const app = koa();
const session = require('koa-generic-session');
const MongoStore = require('koa-generic-session-mongo');
const body = require('koa-bodyparser');
const http = require('http');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const gzip = require('koa-gzip');
const glob = require('glob');
const path = require('path');
const _ = require('lodash');
const serve = require('koa-static');
const fs = require('fs');
const cleanup = require('node-cleanup');


const afterDBConnection = function(db, config) {


	var appFiles = glob.sync(config.path + '/node_app/controllers/*.js');
	if (appFiles.length) {
		router.use('/appv1', session({
			key: 'koa.sid.appv1',
			prefix: 'koa:sess:appv1:',
			store: new MongoStore({
				ttl: 3 * 60 * 60 * 1000,
				collection: 'appv1_sessions',
				db: db.driver._native
			})
		}));
		appFiles.forEach((file) => router.use('/appv1', require(path.resolve(file)).routes()));
	}


	var adminFiles = glob.sync(config.path + '/node_admin/controllers/*.js');
	if (adminFiles.length) {
		router.use('/adminv1', session({
			key: 'koa.sid.adminv1',
			prefix: 'koa:sess:adminv1:',
			store: new MongoStore({
				ttl: 3 * 60 * 60 * 1000,
				collection: 'adminv1_sessions',
				db: db.driver._native
			})
		}));
		adminFiles.forEach((file) => router.use('/adminv1', require(path.resolve(file)).routes()));
	}


	var staffFiles = glob.sync(config.path + '/node_staff/controllers/*.js')
	if (staffFiles.length) {
		router.use('/staffv1', session({
			key: 'koa.sid.staffv1',
			prefix: 'koa:sess:staffv1:',
			store: new MongoStore({
				ttl: 3 * 60 * 60 * 1000,
				collection: 'staffv1_sessions',
				db: db.driver._native
			})
		}));
		staffFiles.forEach((file) => router.use('/staffv1', require(path.resolve(file)).routes()));
	}


	var staticMiddleware = null;
	if (glob.sync(config.path + '/public/**').length)
		staticMiddleware = serve(path.resolve('./public'));


	if (typeof config.beforeMiddleware === 'function')
		config.beforeMiddleware(app, db);
	app.use(gzip());
	app.use(conditional());
	app.use(etag());
	app.keys = config.keys;
	if (config.isDev)
		app.use(require('koa-logger')());
	app.use(function*(next) {
		try {
			this.db = db;
			for (var x in globalVar)
				this[x] = globalVar[x];
			yield next;
		} catch (e) {
			if (!/BadRequestError/.test(e) && !/ForbiddenError/.test(e))
				console.log('STATUS 500 ', this.method, ' ', this.originalUrl, ' ', new Date(),
					'\n\terr: ', e + '', e.stack || '',
					'\n\tsess: ', JSON.stringify(this.session),
					'\n\treq: ', JSON.stringify(this.request.body));
			throw e;
		}
	});
	app.use(body());


	if (typeof config.beforeRoute === 'function')
		config.beforeRoute(app, db);
	app.use(router.routes());
	app.use(router.allowedMethods());
	if (staticMiddleware)
		app.use(staticMiddleware);

	try {
		var indexHtml = fs.readFileSync(path.join(config.path, '/public/index.html'));
		if (indexHtml)
			app.use(function*(next) {
				if (!this.body && !/appv1|staffv1|adminv1|\.[a-zA-Z]{2,4}$/.test(this.url)) {
					this.body = indexHtml || null;
					this.type = 'text/html';
				}
				yield next;
			});
	} catch (e) {
		console.log('warning /public/index.html is not found. spa redirect is disabled');
	}

	if (typeof config.afterMiddleware === 'function')
		config.afterMiddleware(app, db);
	var httpServer = http.createServer(app.callback()).listen(config.httpPort);


	cleanup(function(exitCode, signal) {
		console.log('server closing');
		httpServer.close();
		httpServer.on('close', function() {
			console.log('server closed');
			db.close(function(){
				console.log(arguments);
				cleanup.uninstall();
			});
		});
		nodeCleanup.uninstall();
		return false;
	});

	// process.on('SIGTERM', function() {
	// 	console.log('server closing');
	// 	httpServer.close();
	// });

};



module.exports = function(config) {
	config = _.extend({
		db: 'mongodb://localhost/test',
		isDev: true,
		httpPort: 3000,
		keys: ['abcde', 'fghij']
	}, config);
	console.log(`starting server ${new Date()} port: ${config.httpPort}`);
	console.log('connecting to database...');

	return new Promise(function(res, rej) {
		try {
			const db = require('monkii')(config.db);
			db.driver._emitter.once('open', function() {
				console.log('connected to the database.');
				try {
					afterDBConnection(db, config);
					return res(db);
				} catch (e) {
					return rej(e);
				}
			});
		} catch (e) {
			return rej(e);
		}
	});
};
