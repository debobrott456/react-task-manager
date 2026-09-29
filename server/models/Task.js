/**
 * Returns the 'tasks' collection from the native MongoDB driver.
 * @param {import('mongodb').Db} db
 */
function getTaskCollection(db) {
  return db.collection('tasks');
}

module.exports = { getTaskCollection };
