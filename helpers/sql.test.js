const { sqlForPartialUpdate, sqlForCompFilter, sqlForJobFilter } = require('./sql');

describe('sqlForPartialUpdate', function() {
	test('works with valid data', function() {
		const dataToUpdate = { firstName: 'Aliya', age: 32 };
		const jsToSql = { firstName: 'first_name' };
		const res = sqlForPartialUpdate(dataToUpdate, jsToSql);
		expect(res).toEqual({ setCols: 'first_name=$1, age=$2', values: [ 'Aliya', 32 ] });
	});

	test('works with empty jsToSql obj if not needed', function() {
		const dataToUpdate = { name: 'Aliya', age: 32 };
		const res = sqlForPartialUpdate(dataToUpdate, {});
		expect(res).toEqual({ setCols: 'name=$1, age=$2', values: [ 'Aliya', 32 ] });
	});

	test('throws error if dataToUpdate obj is empty', function() {
		expect(() => {
			sqlForPartialUpdate({}, {});
		}).toThrowError('No data');
	});
});

describe('sqlForCompFilter', function() {
	test('works with all filters', function() {
		const filters = { name: 'net', minEmployees: 100, maxEmployees: 200 };
		const res = sqlForCompFilter(filters);
		expect(res).toEqual({
			whereCols : "name ILIKE '%' || $1 || '%' AND num_employees >= $2 AND num_employees <= $3",
			values    : [ 'net', 100, 200 ]
		});
	});

	test('works with one filter', function() {
		const filters = { name: 'net' };
		const res = sqlForCompFilter(filters);
		expect(res).toEqual({
			whereCols : "name ILIKE '%' || $1 || '%'",
			values    : [ 'net' ]
		});
	});

	test('throws error if minEmployees exceeds maxEmployees', function() {
		expect(() => {
			sqlForCompFilter({ minEmployees: 100, maxEmployees: 50 });
		}).toThrowError('minEmployees cannot exceed maxEmployees');
	});

	test('throws error if minEmployees is not a number', function() {
		expect(() => {
			sqlForCompFilter({ minEmployees: 'cat', maxEmployees: 50 });
		}).toThrowError('minEmployees/maxEmployees must be a number');
	});

	test('throws error if maxEmployees is not a number', function() {
		expect(() => {
			sqlForCompFilter({ minEmployees: 100, maxEmployees: 'dog' });
		}).toThrowError('minEmployees/maxEmployees must be a number');
	});
});

describe('sqlForJobFilter', function() {
	test('works with all filters', function() {
		const filters = { title: 'law', minSalary: 90000, hasEquity: 'true' };
		const res = sqlForJobFilter(filters);
		expect(res).toEqual({
			whereCols : "title ILIKE '%' || $1 || '%' AND salary >= $2 AND equity IS NOT NULL AND equity > 0",
			values    : [ 'law', 90000 ]
		});
	});

	test('works with one filter', function() {
		const filters = { title: 'law' };
		const res = sqlForJobFilter(filters);
		expect(res).toEqual({
			whereCols : "title ILIKE '%' || $1 || '%'",
			values    : [ 'law' ]
		});
	});

	test('throws error if minSalary is not a number', function() {
		expect(() => {
			sqlForJobFilter({ minSalary: 'cat' });
		}).toThrowError('minSalary must be a number');
	});
});
