const { sqlForPartialUpdate } = require('./sql');

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
