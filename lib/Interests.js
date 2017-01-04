var rdb = require('rethinkdb')
var dbconf = require('../config/database')
var connexion = rdb.connect(dbconf)
.then(function (connexion) {
	module.exports.add = function(toAdd) {
		return rdb.table('interests').insert({label: toAdd}).run(connexion)
	}
	module.exports.list = function() {
		return rdb.table('interests').getField('label')
	}
})