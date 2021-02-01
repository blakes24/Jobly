const jwt = require('jsonwebtoken');
const { createToken, verifyToken } = require('./tokens');
const { SECRET_KEY } = require('../config');

describe('createToken', function() {
	test('works: not admin', function() {
		const token = createToken({ username: 'test', is_admin: false });
		const payload = jwt.verify(token, SECRET_KEY);
		expect(payload).toEqual({
			iat      : expect.any(Number),
			username : 'test',
			isAdmin  : false
		});
	});

	test('works: admin', function() {
		const token = createToken({ username: 'test', isAdmin: true });
		const payload = jwt.verify(token, SECRET_KEY);
		expect(payload).toEqual({
			iat      : expect.any(Number),
			username : 'test',
			isAdmin  : true
		});
	});

	test('works: default no admin', function() {
		// given the security risk if this didn't work, checking this specifically
		const token = createToken({ username: 'test' });
		const payload = jwt.verify(token, SECRET_KEY);
		expect(payload).toEqual({
			iat      : expect.any(Number),
			username : 'test',
			isAdmin  : false
		});
	});
});

describe('verifyToken', function() {
	const token = createToken({ username: 'test', is_admin: false });

	test('works: valid token', function() {
		const user = verifyToken(token);
		expect(user).toEqual({
			iat      : expect.any(Number),
			username : 'test',
			isAdmin  : false
		});
	});

	test('works: invalid token', function() {
		expect(() => {
			verifyToken('afd.adf.adf');
		}).toThrow(Error);
	});
});
