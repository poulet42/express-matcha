var express = require('express');
var router = express.Router();
var md = require('../lib/middlewares.js')
var rdb = require('../lib/database.js')
var Users = require('../lib/User.js')
var notif = require('../lib/Notification.js')
module.exports = function(io) {
	router.get('/', function(req, res, next) {
		res.render('index', { title: 'Matcha - Home' });
	})
	router.get('/profile/:username', md.isAuth, function (req, res, next) {
		console.log('route profile  / user')
		if (req.params.username == "") {
			console.log('pas de req params ? redirection vers profil utilisateur courant')
			return res.redirect('/profile/' +  req.session.user.username)
		}
	//rdb.findBy('users', 'username', req.params.username)
	/*console.log('Notification watcher start : ------------------\n\n\n\n\n')
	Users.watchNotifications(req.session.user.username)
	.then( (notifications) => {
		console.log("OKKKKKK ------------------------------\n\n\n\n\n\n")
		// console.log("Watching : --------------------------------------\n\n\n\n\n", notifications)
		notifications.next(function(err, curr){
			if (err) throw err;
			console.log("VALEUR COURANTE ::::::::::::::\n\n\n\n\n", curr)
			io.users[curr.new_val.receiver].emit('notification', {content: "test : " + curr.new_val.text, receiver: curr.new_val.receiver, emitter: curr.new_val.emitter})
		})
	})*/
	Users.findByUsername(req.params.username)
	.then( (user) => {
		user = user[0]
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		} else {
			if (req.params.username != req.session.user.username){
				Users.addNotifications({type: "check", receiver: req.params.username, emitter: req.session.user.username})
				if (io.users[req.params.username]) {
					io.users[req.params.username].emit('notification', notif({type: "check", receiver: req.params.username, emitter: req.session.user.username}))
				}
			}
			console.log(user)
			Users.isLiked(req.session.user.username, req.params.username)
			.then( (bool) => {
				user['likedStatus'] = bool;
				Users.isLiked(req.params.username, req.session.user.username)
				.then( (likedBack) => {
					user['likedBack'] = likedBack
					console.log(user.likedStatus);
					res.render('profile', {
						title: 'Matcha - ' + req.params.username + '\'s Profile', 
						profile: user
					})
				})
			})

		}
	})
})
	router.get('/dashboard', md.isAuth, (req, res, next) => {

	})
	router.get('/register', md.isGuest, (req, res, next) => {
		res.render('register', { title: 'Matcha - Register'})
	})

	router.get('/logout', (req, res, next) => {
		delete io.users[req.session.username];
		req.session.user = null
		res.redirect('/#login')
	})

	router.use(function (err, req, res, next) {
		console.log("middleware d'erreurs !")
		console.log(err)
	})
	return router;
}
// module.exports = router;
