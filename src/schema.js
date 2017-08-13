const { scrypt, Router, schema } = require('koa-basic');
const hash = scrypt.hash;
const { validate } = schema;
const router = module.exports = Router();


router.use('/staff', function*(next) {
	if (this.session.users_type === 'staff')
		return yield next;
	this.error('neet to be a staff', 'DEV: go to /appv1/login', 403);
});


router.put('/staff/users', function*() {
	var input = this.request.body;
	var error = validate(input, addUserSchema);
	if (error)
		return this.error('validation error', error);
	if (input.password !== input.retype_password)
		return this.error('retype password is incorrect');

	var password = yield hash(input.password);
	yield this.db.get('users').insert({
		username: input.username,
		type: input.type,
		password
	});
	this.success();
});
const addUserSchema = {
	type: 'object',
	required: ['username', 'password', 'retype_password', 'type'],
	properties: {
		username: schema.adminUsername,
		password: schema.adminPassword,
		retype_password: schema.adminPassword,
		type: { type: 'string', enum: ['staff', 'normal'] }
	}
};


router.get('/staff/users', function*() {
	this.body = yield this.db.get('users').find({}, 'username type');
});



router.delete('/staff/users/:users_id', function*() {
	var success = yield this.db.get('users').remove({ _id: this.params.users_id, username: { $ne: 'heartnetkung' } });
	if (!success)
		return this.error('user not found');
	this.success();
});
