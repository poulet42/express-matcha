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
			console.log('init ! ')
		})
		socket.on('disconnect', () => {
			console.log('deconnexion de client')
			delete io.users.indexOf(socket)
		})
	})
	return io
}