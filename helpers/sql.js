const { BadRequestError } = require('../expressError');

/** Creates SQL for a partial update. 
 * 
 * It takes an object of items to be updated and an object to convert any camelCase keys to the appropriate snake_case name for the column.
 * 
 * Returns: {setCols, values}
 *  e.g. { setCols : "first_name=$1, age=$2", values: ["Aliya", 32] }
 * 
 * */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	// checks for empty data object
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError('No data');

	// {firstName: 'Aliya', age: 32} => ['first_name=$1', 'age=$2']
	const cols = keys.map((colName, idx) => `${jsToSql[colName] || colName}=$${idx + 1}`);

	// returns string of columns and an array of corresponding values
	return {
		setCols : cols.join(', '),
		values  : Object.values(dataToUpdate)
	};
}

/** Creates SQL to use in the WHERE clause for a filtered SELECT. 
 * 
 * It takes an object of parameters to filter by and returns a string of params for query and an array of values
 * 
 * Params can include: {name, minEmployees, maxEmployees}
 * 
 * Returns: {whereCols, values}
 *  e.g. {
			whereCols : "name ILIKE '%' || $1 || '%' AND num_employees >= $2",
			values    : [ 'net', 100 ]
		}
 * 
 * */

function sqlForFilter(filterParams) {
	//checks minEmployees not greate than max
	if (filterParams['minEmployees'] > filterParams['maxEmployees']) {
		throw new BadRequestError('minEmployees cannot exceed maxEmployees');
	}
	// checks if min/maxEmployees is a number
	if (
		(filterParams['minEmployees'] && isNaN(+filterParams['minEmployees'])) ||
		(filterParams['maxEmployees'] && isNaN(+filterParams['maxEmployees']))
	) {
		throw new BadRequestError('minEmployees/maxEmployees must be a number');
	}

	const keys = Object.keys(filterParams);
	const cols = [];
	// {name: 'net', minEmployees: 100} => ["name ILIKE '%' || $1 || '%'", "num_employees > $2"]
	for (const [ i, key ] of keys.entries()) {
		if (key === 'name') {
			cols.push(`name ILIKE '%' || $${i + 1} || '%'`);
		} else if (key === 'minEmployees') {
			cols.push(`num_employees >= $${i + 1}`);
		} else {
			cols.push(`num_employees <= $${i + 1}`);
		}
	}
	// returns string of columns and an array of corresponding values
	return {
		whereCols : cols.join(' AND '),
		values    : Object.values(filterParams)
	};
}

module.exports = { sqlForPartialUpdate, sqlForFilter };
