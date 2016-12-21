var rdb = require('rethinkdb');
var dbconf = require('../config/database')

var connexion = rdb.connect(dbconf)
.then(function (connexion) {

    module.exports.find = function (tableName, id) {
        return rdb.table(tableName).get(id).run(connexion)
        .then(function (result) {
            return result;
        });
    };

    module.exports.findAll = function (tableName) {
        return rdb.table(tableName).run(connexion)
        .then(function (cursor) {
            return cursor.toArray();
        });
    };
    
    module.exports.filterFrom = (tableName, filterFunc) => {
        return rdb.table(tableName)
        .filter(row => {return filterFunc(row)})
        .run(connexion).then( (cursor) => {
            return cursor.toArray()
        })
    }
    module.exports.findBy = function (tableName, fieldName, value) {
        return rdb.table(tableName).filter(rdb.row(fieldName).eq(value)).run(connexion)
        .then(function (cursor) {
            return cursor.toArray();
        });
    };

    module.exports.findIndexed = function (tableName, query, index) {
        return rdb.table(tableName).getAll(query, { index: index }).run(connexion)
        .then(function (cursor) {
            return cursor.toArray();
        });
    };

    module.exports.save = function (tableName, object) {
        return rdb.table(tableName).insert(object).run(connexion)
        .then(function (result) {
            return result;
        });
    };

    module.exports.edit = function (tableName, id, object) {
        return rdb.table(tableName).get(id).update(object).run(connexion)
        .then(function (result) {
            return result;
        });
    };

    module.exports.destroy = function (tableName, id) {
        return rdb.table(tableName).get(id).delete().run(connexion)
        .then(function (result) {
            return result;
        });
    };


});
