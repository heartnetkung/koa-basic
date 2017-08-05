const { set } = require('lodash');
const { ObjectId } = require('mongodb');

/*
	execute function (not generator) after this request finish
*/
exports.later = function(asyncFunction) {
	setImmediate(function() {
		try {
			asyncFunction();
		} catch (e) {}
	});
};

/*
	immediately return http response with the given message and status and perhaps some info about the error
*/
exports.error = function(error_message, error_info, status) {
	if (typeof error_info === 'number') {
		status = error_info;
		error_info = null;
	}

	var errorObject = { error: error_message };
	if (error_info)
		errorObject.error_info = error_info;
	this['throw'](status || 400, JSON.stringify(errorObject, null, 2));
};

/*
	set http response to {success:true, key1:value1, key2:value2, ...}
*/
exports.success = function(key1, value1) {
	var ans = { success: true };
	for (var i = 0, ii = arguments.length; i < ii; i += 2)
		ans[arguments[i]] = arguments[i + 1];
	this.body = ans;
};

/*
	change {'a.x':2} to {a:{x:2}}
*/
exports.multiLevelObject = function(obj) {
	var ans = {};
	for (var x in obj)
		set(ans, x, obj[x]);
	return ans;
};

exports.extendLoginSession = function() {
	this.session.lastUpdate = new Date();
};

exports.ObjectId = ObjectId;