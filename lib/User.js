var rdb = require('rethinkdb')
var dbconf = require('../config/database')
var fs = require('fs')
var connexion = rdb.connect(dbconf)
.then(function (connexion) {
	module.exports.removeInterest = function(id, toDelete) {
		return rdb.table('users').get(id).update(function(row) {
			return {interests: row('interests').difference([toDelete])}
		}).run(connexion)
	}
	module.exports.getInterests = function() {
		// rdb.table('users')get(.merge(function(user) {
		// 	return {
		// 		interests: rdb.table('interests').getAll(rdb.args(user('interests'))).coerceTo('array')
		// 	}
		// }).run(connexion)
	}
	module.exports.addInterest = function(id, toAdd) {
		return rdb.table('users').get(id).getField('interests').append(toAdd).run(connexion)
	}
	module.exports.list = function() {
		return rdb.table('users').without('password')
		.merge(function(user) {
			return {
				interests: rdb.table('interests').getAll(rdb.args(user('interests'))).coerceTo('array')
			}
		}).run(connexion)
		.then( function (cursor) {
			return cursor.toArray()
		})
	}
	module.exports.findById = function(id) {
		return rdb.table('users').get(id).without('password').run(connexion)
	}
	module.exports.findByUsername = function(username) {
		console.log('findByUsername : ' + username)
		return rdb.table('users')
		.merge(function(user) {
			return {
				interests: rdb.table('interests').getAll(rdb.args(user('interests'))).coerceTo('array')
			}
		})
		.filter(rdb.row('username').eq(username)).without('password').run(connexion)
		.then( function (cursor) {
			return cursor.toArray()
		})
	}
	module.exports.exists = function(username, mail) {
		return rdb.table('users')
		.filter(row => {
			return row('username').eq(username).
			or(row('email').eq(mail))
		})
		.run(connexion).then( (cursor) => {
			return cursor.toArray()
		})
	}
	module.exports.register = function(creds) {
		var user = {
			firstname: creds.fname,
			lastname: creds.lname,
			password: creds.password,
			email: creds.email
		}
		return rdb.table('users')
		.insert(user).run(connexion)
        .then(function (result) {
            return result;
        });
	}
	module.exports.getPhotos = function(username, cb) {
		console.log("recuperation des images de l'utilisateur ")
		return fs.readdir(__dirname + "/../public/upload/" + username, cb)
	}
	module.exports.addPhoto = function(username, filename) {
		console.log('addPhoto called !')
		return rdb.table('users').filter(
			function(user) {
				return user('username').eq(username)
			}).update({avatar: filename}).run(connexion)
	}
})