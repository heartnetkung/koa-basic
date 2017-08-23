const { Validator } = require('jsonschema');
const v = new Validator();
const _ = require('lodash');

module.exports = {
	basicLabel: {
		type: 'string',
		minLength: 1,
		maxLength: 50,
		pattern: '^[ _0-9ก-๙a-zA-Z\'\\.\\-,\\(\\)]*$'
	},
	longLabel: {
		type: 'string',
		minLength: 1,
		maxLength: 1000,
		pattern: '^[ _0-9ก-๙a-zA-Z\'\\.\\-,\\(\\)]*$'
	},
	ignorableLabel: {
		type: 'string',
		minLength: 0,
		maxLength: 50,
		pattern: '^[ _0-9ก-๙a-zA-Z\'\\.\\-,\\(\\)]*$'
	},
	adminUsername: {
		type: 'string',
		minLength: 6,
		maxLength: 50,
		pattern: '^[_0-9a-zA-Z]*$'
	},
	adminPassword: {
		type: 'string',
		minLength: 6,
		maxLength: 50,
		pattern: '^[_0-9a-zA-Z]*$'
	},
	username: {
		type: 'string',
		minLength: 4,
		maxLength: 50,
		pattern: '^[_0-9a-zA-Z@\\.]*$'
	},
	integer: {
		type: 'string',
		pattern: '^\\d*$',
		maxLength: 9,
		minLength: 1
	},
	negativeInteger: {
		type: 'string',
		pattern: '^-?\\d*$',
		maxLength: 9,
		minLength: 1
	},
	humanName: {
		type: 'string',
		minLength: 3,
		maxLength: 50,
		pattern: '^[ ก-๏a-zA-Z\'\\.\\-]*$'
	},
	mongoId: {
		type: 'string',
		pattern: '^[0-9a-f]{24}$'
	},
	boolean: {
		type: 'string',
		pattern: '^true$|^false$'
	},
	date: {
		type: 'string',
		pattern: '^\\d{4}-\\d\\d?-\\d\\d?$'
	},
	validate: function(obj, schema) {
		if (typeof obj === 'undefined')
			obj = null;
		var result = v.validate(obj, schema).errors;
		if (!result.length)
			return false;
		var map = _.groupBy(result, 'property');
		for (var property in map) {
			var group = map[property];
			for (var i = 0, ii = group.length; i < ii; i++)
				group[i] = group[i].message;
		}
		map.__uitext = stringify(map);
		return map;
	},
	escapeMongoField: function(name) {
		var entityMap = { '&': '&amp;', '$': '&#36;', '.': '&#46;' };
		return String(name).replace(/[$&.]/, function(s) {
			return entityMap[s];
		});
	}
};
const stringify = (a) => {
	var lines = [];
	for (var x in a) {
		if (!Array.isArray(a[x]))
			lines.push(`${x}: ${a[x]}`);
		else
			for (var y of a[x])
				lines.push(`${x}: ${y}`);
	}
	return lines.join('<br/>').replace(/instance:|instance\./g, '');
}
