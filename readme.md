## API
```js
exports.server = require('./server');
exports.schema = require('./schema');
exports.scrypt = require('./scrypt_facade');
exports.ObjectId = require('mongodb').ObjectId;
exports.router = require('koa-router');
exports.monkii = require('monkii');

exports.server({
	db: 'mongodb://localhost/test',
	isDev: true,
	httpPort: 3000,
	keys: ['abcde', 'fghij']
});
```
