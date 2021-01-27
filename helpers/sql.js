const { BadRequestError } = require('../expressError');

/** Creates SQL for a partial update. 
 * 
 * It takes an object of items to be updated and an object to convert any camelCase keys to the appropriate snake_case name for the column.
 * 
 * sqlForPartialUpdate( {firstName: 'Aliya', age: 32}, {firstName: "first_name"} )
 * 
 * returns:
 *  { setCols : "first_name=$1, age=$2", values: ["Aliya", 32] }
 * 
 * */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError('No data');

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map((colName, idx) => `${jsToSql[colName] || colName}=$${idx + 1}`);

	// returns string of columns and an array of corresponding values
	return {
		setCols : cols.join(', '),
		values  : Object.values(dataToUpdate)
	};
}

module.exports = { sqlForPartialUpdate };
