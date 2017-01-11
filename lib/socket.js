var socketio = require('socket.io')

module.exports.listen = function(app){
	io = socketio.listen(app);
	io.users = [];
	io.on('connection', function(socket) {
		socket.on('init', function(username) {
			var curr;
			if ((curr = io.users.find((elem) => {
				return elem.username === username;
			}))) {
				delete curr; 	
			}
			io.users[username] = socket;
			console.log('init ! ', io.users[username])
		})
		socket.on('test', (data) => {
			console.log('holy shit ca marche')
			console.log(socket.id)
		})
		socket.on('send notification', (data) => {
			var emitter = Object.keys(io.users).find(key => io.users[key] === socket)
			console.log('nouvelle notification pour ' + data.receiver + ' !', emitter + " " + data.content)
			if (typeof io.users[data.receiver] !== 'undefined')
				io.users[data.receiver].emit('notification', {content: data.content, receiver: data.receiver, emitter})
		})
		socket.on('disconnect', () => {
			console.log('deconnexion de client')
			delete io.users.indexOf(socket)
		})
	})
	return io
}