const { kdf, verifyKdf } = require("scrypt");

exports.hash = function(secret) {
	return new Promise(function(resolve, reject) {
		kdf(new Buffer(secret), {
			N: 13,
			r: 8,
			p: 1
		}).then(function(result) {
			resolve(result.toString('base64'));
		}, reject);
	});
};

exports.checkHash = function(secret, hashedSecret) {
	return verifyKdf(new Buffer(hashedSecret, 'base64'), secret);
}
