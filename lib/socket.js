var socketio = require('socket.io')

module.exports.listen = function(app){
	io = socketio.listen(app)
	var users = [];
	io.on('connection', function(socket) {
		socket.on('init', function(username) {
			users[username] = socket;
		})
		socket.on('test', (data) => {
			console.log('holy shit ca marche')
			console.log(socket.id)
		})
		socket.on('send notification', (data) => {
			console.log('nouvelle notification pour ' + data.receiver + ' !', data.notification)
			if (typeof users[data.receiver] !== 'undefined')
				users[data.receiver].emit('notification', data.notification)
		})
	})
	return io
}