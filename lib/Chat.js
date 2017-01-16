var rdb = require('rethinkdb')
var dbconf = require('../config/database')
var connexion = rdb.connect(dbconf)
.then(function (connexion) {
	module.exports.createRoom = function(users) {
		return rdb.table('chat').insert({
			users, 
			enabled: true, 
			messages: []
		}).run(connexion)
	},
	module.exports.createMessage = function(args) {
		return rdb.table('chat').get(args.roomId)('messages')
		.append({content: args.content, created: new Date(), emitter: args.emitter, receiver: args.receiver, read: false})
		.run(connexion)
	}

	module.exports.getData = function(roomId) {
		return rdb.table('chat').get(roomId).run(connexion)
	}

	module.exports.getChatRoomFromUsers = function(users) {
		return rdb.table('chat')
		.filter((chatRoom) => {
			return chatRoom('users').contains(users[0])
			.and(chatRoom('users').contains(users[1]))
		}).coerceTo('array').run(connexion)
	}

	module.exports.disableRoom = function(users) {
		return rdb.table('chat')
		.filter((chatRoom) => {
			return chatRoom('users').contains(users[0])
			.and(chatRoom('users').contains(users[1]))
		}).update({enabled: false}).run(connexion)
	}

	module.exports.enableRoom = function(users) {
		return rdb.table('chat')
		.filter((chatRoom) => {
			return chatRoom('users').contains(users[0])
			.and(chatRoom('users').contains(users[1]))
		}).update({enabled: true}).run(connexion)
	}

	module.exports.addMessage = function(id, data) {
		return rdb.table('chat').get(id)
		.update(row => {
			return {messages: row('messages').append({emitter: data.username, content: data.content})}
		}).run(connexion)
	}
})