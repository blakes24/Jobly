'use strict';

/** Convenience middleware to handle common auth cases in routes. */
const { UnauthorizedError } = require('../expressError');
const { verifyToken } = require('../helpers/tokens');

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
	try {
		const authHeader = req.headers && req.headers.authorization;
		if (authHeader) {
			const token = authHeader.replace(/^[Bb]earer /, '').trim();
			res.locals.user = verifyToken(token);
		}
		return next();
	} catch (err) {
		return next();
	}
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
	try {
		if (!res.locals.user) throw new UnauthorizedError();
		return next();
	} catch (err) {
		return next(err);
	}
}

/** Middleware to use when they must be Admin.
 *
 * If not, raises Unauthorized.
 */

function ensureAdmin(req, res, next) {
	try {
		if (!res.locals.user || !res.locals.user.isAdmin) throw new UnauthorizedError();
		return next();
	} catch (err) {
		return next(err);
	}
}

/** Middleware to use when they must be Admin or their username must be in req.params.
 *
 * If not, raises Unauthorized.
 */

function ensureUserOrAdmin(req, res, next) {
	try {
		if (res.locals.user && (res.locals.user.username === req.params.username || res.locals.user.isAdmin)) {
			return next();
		}
		throw new UnauthorizedError();
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	authenticateJWT,
	ensureLoggedIn,
	ensureAdmin,
	ensureUserOrAdmin
};
