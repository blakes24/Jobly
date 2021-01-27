const { sqlForPartialUpdate, sqlForFilter } = require('./sql');

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

describe('sqlForFilter', function() {
	test('works with valid data', function() {
		const filterParams = { name: 'net', minEmployees: 100 };
		const res = sqlForFilter(filterParams);
		expect(res).toEqual({
			whereCols : "name ILIKE '%' || $1 || '%' AND num_employees >= $2",
			values    : [ 'net', 100 ]
		});
	});

	test('works with just name', function() {
		const filterParams = { name: 'net' };
		const res = sqlForFilter(filterParams);
		expect(res).toEqual({
			whereCols : "name ILIKE '%' || $1 || '%'",
			values    : [ 'net' ]
		});
	});

	test('throws error if minEmployees exceeds maxEmployees', function() {
		expect(() => {
			sqlForFilter({ minEmployees: 100, maxEmployees: 50 });
		}).toThrowError('minEmployees cannot exceed maxEmployees');
	});

	test('throws error if minEmployees is not a number', function() {
		expect(() => {
			sqlForFilter({ minEmployees: 'cat', maxEmployees: 50 });
		}).toThrowError('minEmployees/maxEmployees must be a number');
	});

	test('throws error if maxEmployees is not a number', function() {
		expect(() => {
			sqlForFilter({ minEmployees: 100, maxEmployees: 'dog' });
		}).toThrowError('minEmployees/maxEmployees must be a number');
	});
});
