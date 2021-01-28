'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function() {
	const newJob = {
		title         : 'A Job',
		salary        : 65000,
		equity        : 0,
		companyHandle : 'c1'
	};

	test('works', async function() {
		let job = await Job.create(newJob);
		expect(job).toEqual({
			id            : expect.any(Number),
			title         : 'A Job',
			salary        : 65000,
			equity        : '0',
			companyHandle : 'c1'
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'A Job'`
		);
		expect(result.rows).toEqual([
			{
				id            : expect.any(Number),
				title         : 'A Job',
				salary        : 65000,
				equity        : '0',
				companyHandle : 'c1'
			}
		]);
	});
});

/************************************** findAll */

describe('findAll', function() {
	test('gets all jobs', async function() {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
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
		]);
	});
});

/************************************** findFiltered */

describe('findFiltered', function() {
	test('works with title filter', async function() {
		let jobs = await Job.findFiltered({ title: '1' });
		expect(jobs).toEqual([
			{
				id            : expect.any(Number),
				title         : 'Job 1',
				salary        : 45000,
				equity        : '0',
				companyHandle : 'c1'
			}
		]);
	});

	test('works with minSalary filter', async function() {
		let jobs = await Job.findFiltered({ minSalary: 65000 });
		expect(jobs).toEqual([
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
		]);
	});

	test('works with hasEquity filter', async function() {
		let jobs = await Job.findFiltered({ hasEquity: 'true' });
		expect(jobs).toEqual([
			{
				id            : expect.any(Number),
				title         : 'Job 3',
				salary        : 83000,
				equity        : '0.03',
				companyHandle : 'c3'
			}
		]);
	});

	test('works with all filters', async function() {
		let jobs = await Job.findFiltered({ hasEquity: 'true', title: 'j', minSalary: 60000 });
		expect(jobs).toEqual([
			{
				id            : expect.any(Number),
				title         : 'Job 3',
				salary        : 83000,
				equity        : '0.03',
				companyHandle : 'c3'
			}
		]);
	});

	test('returns no jobs found message', async function() {
		let jobs = await Job.findFiltered({ title: '2', minSalary: 80000, hasEquity: 'true' });
		expect(jobs).toEqual({ msg: 'No jobs match the search criteria' });
	});
});

/************************************** get */

describe('get', function() {
	let job1;
	beforeEach(async function() {
		await db.query('BEGIN');
		const res = await db.query(`
        SELECT * FROM jobs WHERE title = 'Job 1'`);
		job1 = res.rows[0];
	});

	test('works', async function() {
		let job = await Job.get(job1.id);
		expect(job).toEqual({
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
		});
	});

	test('not found if no such job', async function() {
		try {
			await Job.get(99999999);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe('update', function() {
	let job1;
	beforeEach(async function() {
		await db.query('BEGIN');
		const res = await db.query(`
        SELECT * FROM jobs WHERE title = 'Job 1'`);
		job1 = res.rows[0];
	});
	const updateData = {
		title  : 'New Job',
		salary : 55000,
		equity : 0.01
	};

	test('works', async function() {
		let job = await Job.update(job1.id, updateData);
		expect(job).toEqual({
			id            : job1.id,
			title         : 'New Job',
			salary        : 55000,
			equity        : '0.01',
			companyHandle : 'c1'
		});

		const result = await db.query(
			`SELECT *
           FROM jobs
           WHERE id = ${job1.id}`
		);
		expect(result.rows).toEqual([
			{
				id             : job1.id,
				title          : 'New Job',
				salary         : 55000,
				equity         : '0.01',
				company_handle : 'c1'
			}
		]);
	});

	test('works: null fields', async function() {
		const updateDataSetNulls = {
			title  : 'New Job',
			salary : null,
			equity : null
		};

		let job = await Job.update(job1.id, updateDataSetNulls);
		expect(job).toEqual({
			id            : job1.id,
			companyHandle : 'c1',
			...updateDataSetNulls
		});

		const result = await db.query(
			`SELECT *
           FROM jobs
           WHERE id = ${job1.id}`
		);
		expect(result.rows).toEqual([
			{
				id             : job1.id,
				title          : 'New Job',
				salary         : null,
				equity         : null,
				company_handle : 'c1'
			}
		]);
	});

	test('not found if no such job', async function() {
		try {
			await Job.update(99999, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('bad request with no data', async function() {
		try {
			await Job.update(job1.id, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe('remove', function() {
	let job1;
	beforeEach(async function() {
		await db.query('BEGIN');
		const res = await db.query(`
        SELECT * FROM jobs WHERE title = 'Job 1'`);
		job1 = res.rows[0];
	});

	test('works', async function() {
		await Job.remove(job1.id);
		const res = await db.query(`SELECT id FROM jobs WHERE id = ${job1.id}`);
		expect(res.rows.length).toEqual(0);
	});

	test('not found if no such job', async function() {
		try {
			await Job.remove(99999999);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
