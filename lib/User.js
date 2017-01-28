var rdb = require('rethinkdb')
var dbconf = require('../config/database')
var fs = require('fs')
var connexion = rdb.connect(dbconf)
.then(function (connexion) {
	module.exports.matchHash = function(username, hash) {
		return rdb.table("users").filter({username, forgot: hash}).count().run(connexion)
		.then( (numer) => {
			return numer > 0
		})
	}
	module.exports.setPassword = function(username, pw, hash) {
		return rdb.table("users").filter({username})
		.update({password: pw, forgot: hash}).run(connexion)
	}
	module.exports.updateIdentity = function(userId, creds) {
		return rdb.table("users").get(userId)
		.update({email: creds.email, firstname: creds.fname, lastname: creds.lname}).run(connexion)
	}
	module.exports.toggleBlock = function(currentId, toBlock) {
		var user = rdb.table('users').get(currentId)
		return user("blocked").contains(toBlock)
		.branch(
			user.update((row) => {return {blocked: row('blocked').difference([toBlock])}}, {returnChanges: true}),
			user.update((row) => {return {blocked: row('blocked').append(toBlock)}}, {returnChanges: true})
			)
		.run(connexion)
		.then( result => {
			console.log(result)
			return result.changes[0].new_val.blocked.indexOf(toBlock) != -1
		})
	}
	module.exports.addPopularity = function(user, points) {
		return rdb.table('users').filter({username: user}).update( (row) => {
			return {popularity: row('popularity').add(points)}
		}).run(connexion)
	}
	module.exports.isBlocked = function(username, by) {
		return rdb.table('users').get(by)('blocked').contains(username).run(connexion)
	}
	module.exports.getBlacklist = function(username) {
		return rdb.table('users').filter({username: username})('blocked').coerceTo('array').run(connexion)
		.then (cursor => {return cursor[0]})
	}
	module.exports.removeInterest = function(id, toDelete) {
		return rdb.table('users').get(id).update(function(row) {
			return {interests: row('interests').difference([toDelete])}
		}).run(connexion)
	}
	module.exports.setGender = function(id, gender) {
		return rdb.table('users').get(id).update({gender}).run(connexion)
	}
	module.exports.setOrientation = function(id, orientation) {
		return rdb.table('users').get(id).update({orientation}).run(connexion)
	}
	module.exports.setBiography = function(id, biography) {
		return rdb.table('users').get(id).update({biography}).run(connexion)
	}
	module.exports.addInterest = function(id, toAdd) {
		return rdb.table('users').get(id)
		.update(row => {
			return {interests: row('interests').append(toAdd)}
		}).run(connexion)
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
	module.exports.hasField = function(userId, fieldName) {
		return rdb.table('users').get(userId).hasFields([fieldName]).run(connexion)
	}
	module.exports.listByDistance = function(userId) {
		var user = rdb.table('users').get(userId);
		var currentLocation = rdb.table('users').get(userId)('location');
		return rdb.table('users')
		.getNearest(currentLocation, {index: 'location', maxResults: 25, maxDist: 1000000})
		.merge(function(user) {
			return {
				doc: {interests: rdb.table('interests').getAll(rdb.args(user('doc')('interests'))).coerceTo('array')} 
			}
		}).without('doc.password')
		.run(connexion)
	}
	module.exports.findById = function(id) {
		return rdb.table('users').get(id).without('password').run(connexion)
	}
	module.exports.findByUsername = function(username, showPassword = false) {
		console.log('findByUsername : ' + username)
		return rdb.table('users')
		.merge(function(user) {
			return {
				interests: rdb.table('interests').getAll(rdb.args(user('interests'))).coerceTo('array')
			}
		})
		.filter(rdb.row('username').eq(username)).run(connexion)
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
			email: creds.email,
			interests: [],
			username: creds.username,
			age: creds.age,
			popularity: 0,
			blocked: [],
			gender: "unknown",
			orientation: "both",
			new: true,
			forgot: creds.forgot
		}
		return rdb.table('users')
		.insert(user).run(connexion)
		.then(function (result) {
			return result;
		});
	}
	module.exports.getPhotos = function(username, cb) {
		console.log("recuperation des images de l'utilisateur " + username)
		return fs.readdir(__dirname + "/../public/upload/" + username, cb)
	}
	module.exports.addPhoto = function(username, filename) {
		console.log('addPhoto called !')
		return rdb.table('users').filter(
			function(user) {
				return user('username').eq(username)
			}).update({avatar: filename}).run(connexion)
	}
	module.exports.deletePhoto = function(username, filename, cb) {
		return fs.unlink(__dirname + "/../public/upload/" + username + '/' + filename, cb)
	}
	module.exports.getAvatar = function(usern) {
		return rdb.table('users').filter({username: usern}).getField('avatar').coerceTo('array')
		.run(connexion)
	}
	module.exports.deleteAvatar = function(username) {
		return rdb.table('users').filter(
			function(user) {
				return user('username').eq(username)
			}).update({avatar: ""}).run(connexion)
	}
	module.exports.toggleLike = function(liker, liked) {
		return rdb.table('likes').contains(rdb.row('emitter').eq(liker).and(rdb.row('receiver').eq(liked)))
		.branch(
			rdb.table('likes').filter((row) => {
				return row('emitter')
				.eq(liker)
				.and(row('receiver').eq(liked))
			})
			.delete()
			,
			rdb.table('likes').insert({emitter: liker, receiver: liked})
			).run(connexion)
		.then( (res) => {
			console.log(res)
			return res.inserted === 1
		})
	}
	module.exports.isLiked = function (liker, liked) {
		return rdb.table('likes').contains(
			function(row) {
				return row('emitter').eq(liker).and(row('receiver').eq(liked))
			}).run(connexion)
	}
	module.exports.match = function(current, other) {
		return rdb.table('likes').contains(
			function(row) { return
				row('emitter').eq(current).and(row('receiver').eq(other))
			}, 
			function(row) { return
				row('emitter').eq(other).and(row('receiver').eq(current))
			}).run(connexion)
	}
	module.exports.addNotifications = function(options) {
		return rdb.table('notifications').insert({ type: options.type, emitter:options.emitter, receiver:options.receiver}).run(connexion)
	}
	module.exports.watchNotifications = function(receiver) {
		console.log('Watching ! ------------\n\n\n\n')
		return rdb.table('notifications').changes().limit(1).run(connexion)
	}
	module.exports.getNotifications = function(receiver) {
		return rdb.table('notifications').filter((row) => {
			return row('receiver').eq(receiver)
		}).run(connexion)
		.then((res) => {
			return res.toArray()
		})
	}
	module.exports.getChatRooms = function(username, options) {
		var result = rdb.table('chat').getAll(username, {index: 'users'}).map((chat) => chat.merge({ messages: chat('messages').limit(1) }))
		if (options.enabledOnly === true)
			result = result.filter({enabled: true})
		return result.coerceTo('array').run(connexion)
		.then( (cursor) => {
			return cursor.toArray()
		})
	}
	module.exports.hasInterest = function(userId, interestId) {
		return rdb.table('users').get(userId)('interests')
		.contains(interestId)
		.run(connexion)
	}
	module.exports.setLocation = function(userId, data) {
		var lat = parseFloat(data.coords.latitude);
		var long = parseFloat(data.coords.longitude);
		return rdb.table('users').get(userId).update({location: rdb.point(long, lat), address: data.address, formattedAddress: data.formattedAddress})
		.run(connexion)
	}
})