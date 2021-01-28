'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2Token
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe('POST /jobs', function() {
	const newJob = {
		title         : 'A Job',
		salary        : 65000,
		equity        : 0,
		companyHandle : 'c1'
	};

	test('ok for admin', async function() {
		const resp = await request(app).post('/jobs').send(newJob).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job : {
				id            : expect.any(Number),
				title         : 'A Job',
				salary        : 65000,
				equity        : '0',
				companyHandle : 'c1'
			}
		});
	});

	test('bad request with missing data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title  : 'A Job',
				salary : 65000
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request with invalid data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title         : 'A Job',
				salary        : -56,
				equity        : 0,
				companyHandle : 45
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('unauth if not admin', async function() {
		const resp = await request(app).post('/jobs').send(newJob).set('authorization', `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});
});

/************************************** GET /jobs */

describe('GET /jobs', function() {
	test('ok for anon', async function() {
		const resp = await request(app).get('/jobs');
		expect(resp.body).toEqual({
			jobs : [
				{
					id            : expect.any(Number),
					title         : 'Job 1',
					salary        : 45000,
					equity        : '0',
					companyHandle : 'c1'
				},
				{
					id            : expect.any(Number),
					title         : 'Job 2',
					salary        : 70000,
					equity        : '0',
					companyHandle : 'c2'
				},
				{
					id            : expect.any(Number),
					title         : 'Job 3',
					salary        : 83000,
					equity        : '0.03',
					companyHandle : 'c3'
				}
			]
		});
	});

	test('works with single filter', async function() {
		const resp = await request(app).get('/jobs?minSalary=55000');
		expect(resp.body).toEqual({
			jobs : [
				{
					id            : expect.any(Number),
					title         : 'Job 2',
					salary        : 70000,
					equity        : '0',
					companyHandle : 'c2'
				},
				{
					id            : expect.any(Number),
					title         : 'Job 3',
					salary        : 83000,
					equity        : '0.03',
					companyHandle : 'c3'
				}
			]
		});
	});

	test('works with all filters', async function() {
		const resp = await request(app).get('/jobs?title=j&minSalary=60000&hasEquity=true');
		expect(resp.body).toEqual({
			jobs : [
				{
					id            : expect.any(Number),
					title         : 'Job 3',
					salary        : 83000,
					equity        : '0.03',
					companyHandle : 'c3'
				}
			]
		});
	});

	test('throws error if passed unauthorized query parameters', async function() {
		const resp = await request(app).get('/jobs?cats=5');
		expect(resp.status).toEqual(400);
	});

	test('throws error if value of query parameter is wrong type', async function() {
		const resp = await request(app).get('/jobs?minSalary=dog');
		expect(resp.status).toEqual(400);
	});
});

/************************************** GET /jobs/:id */

describe('GET /jobs/:id', function() {
	let job1;
	beforeEach(async function() {
		await db.query('BEGIN');
		const res = await db.query(`
        SELECT * FROM jobs WHERE title = 'Job 1'`);
		job1 = res.rows[0];
	});
	test('works for anon', async function() {
		const resp = await request(app).get(`/jobs/${job1.id}`);
		expect(resp.body).toEqual({
			job : {
				id      : job1.id,
				title   : 'Job 1',
				salary  : 45000,
				equity  : '0',
				company : {
					handle       : 'c1',
					name         : 'C1',
					description  : 'Desc1',
					numEmployees : 1,
					logoUrl      : 'http://c1.img'
				}
			}
		});
	});

	test('not found for no such job', async function() {
		const resp = await request(app).get(`/jobs/99999`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /jobs/:id */

describe('PATCH /jobs/:id', function() {
	let job1;
	beforeEach(async function() {
		await db.query('BEGIN');
		const res = await db.query(`
        SELECT * FROM jobs WHERE title = 'Job 1'`);
		job1 = res.rows[0];
	});

	test('works for admin', async function() {
		const resp = await request(app)
			.patch(`/jobs/${job1.id}`)
			.send({
				title  : 'New Title',
				salary : 50000
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			job : {
				id            : job1.id,
				title         : 'New Title',
				salary        : 50000,
				equity        : '0',
				companyHandle : 'c1'
			}
		});
	});

	test('unauth for anon', async function() {
		const resp = await request(app).patch(`/jobs/${job1.id}`).send({
			title : 'new'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('unauth for non-amin user', async function() {
		const resp = await request(app)
			.patch(`/jobs/${job1.id}`)
			.send({
				title : 'new'
			})
			.set('authorization', `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found on no such company', async function() {
		const resp = await request(app)
			.patch(`/jobs/99999`)
			.send({
				title : 'nope'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});

	test('bad request on company change attempt', async function() {
		const resp = await request(app)
			.patch(`/jobs/${job1.id}`)
			.send({
				companyHandle : 'c1-new'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request on invalid data', async function() {
		const resp = await request(app)
			.patch(`/jobs/${job1.id}`)
			.send({
				salary : 'kittens'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /jobs/:id */

describe('DELETE /jobs/:id', function() {
	let job1;
	beforeEach(async function() {
		await db.query('BEGIN');
		const res = await db.query(`
        SELECT * FROM jobs WHERE title = 'Job 1'`);
		job1 = res.rows[0];
	});

	test('works for admin', async function() {
		const resp = await request(app).delete(`/jobs/${job1.id}`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ deleted: `${job1.id}` });
	});

	test('unauth for anon', async function() {
		const resp = await request(app).delete(`/jobs/${job1.id}`);
		expect(resp.statusCode).toEqual(401);
	});
	test('unauth for non-admin user', async function() {
		const resp = await request(app).delete(`/jobs/${job1.id}`).set('authorization', `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found for no such company', async function() {
		const resp = await request(app).delete(`/jobs/99999`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});
