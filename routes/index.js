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
		var userData;
		Users.findByUsername(req.params.username)
		.then( (userArray) => {
			return userArray[0]
		})
		.then( (user) => {
			if (!user) {
				res.status(404).json({ error: 'User not found' })
				return next({error: 'User not found'})
			} else if (req.params.username != req.session.user.username) {
				Users.addNotifications({type: "check", receiver: req.params.username, emitter: req.session.user.username})
				if (io.users[req.params.username]) {
					io.users[req.params.username].emit('notification', notif({type: "check", receiver: req.params.username, emitter: req.session.user.username}))
				}
			}
			userData = user;
			return Users.isLiked(req.session.user.username, req.params.username)
		})
		.then( (isLiked) => {
			userData['likedStatus'] = isLiked
			return Users.isLiked(req.params.username, req.session.user.username)
		})
		.then( (likedBack) => {
			userData['likedBack'] = likedBack
		})
		.then ( () => {
			res.render('profile', {
				title: 'Matcha - ' + req.params.username + '\'s Profile', 
				profile: userData
			})
		})


		// .then( (user) => {
		// 	user = user[0]
		// 	if (!user) {
		// 		return res.status(404).json({ error: 'User not found' })
		// 	} else {
		// 		if (req.params.username != req.session.user.username){
		// 			Users.addNotifications({type: "check", receiver: req.params.username, emitter: req.session.user.username})
		// 			if (io.users[req.params.username]) {
		// 				io.users[req.params.username].emit('notification', notif({type: "check", receiver: req.params.username, emitter: req.session.user.username}))
		// 			}
		// 		}
		// 		console.log(user)
		// 		Users.isLiked(req.session.user.username, req.params.username)
		// 		.then( (bool) => {
		// 			user['likedStatus'] = bool;
		// 			Users.isLiked(req.params.username, req.session.user.username)
		// 			.then( (likedBack) => {
		// 				user['likedBack'] = likedBack
		// 				user['online'] = (typeof io.users[req.params.username] != 'undefined')
		// 				console.log('ONLINE ? ', user['online'], io.users[req.params.username])
		// 				console.log(user.likedStatus);
		// 				res.render('profile', {
		// 					title: 'Matcha - ' + req.params.username + '\'s Profile', 
		// 					profile: user
		// 				})
		// 			})
		// 		})

		// 	}
		// })
	})
	router.get('/dashboard', md.isAuth, (req, res, next) => {
		Users.listByDistance(req.session.user.id)
		.then( (usersList) => {
			var currUser = usersList.filter( (elem) => {
				return elem.doc.id === req.session.user.id
			})[0]
			console.log(currUser);
			var newUsersList = usersList.map( (elem) => {
				elem.doc.interests = elem.doc.interests.filter( (interestCursor) => {
					console.log('curs', interestCursor)
					return currUser.doc.interests.map( (e) => {
						return e.id
					}).indexOf(interestCursor.id) > -1
				})
				return elem
			});
			console.log(newUsersList)
			res.render('dashboard', {title: 'Matcha - Dashboard', users: newUsersList})	
		})
	});
	router.get('/register', md.isGuest, (req, res, next) => {
		res.render('register', { title: 'Matcha - Register'})
	})

	router.get('/logout', (req, res, next) => {
		delete io.users[req.session.username];
		delete req.session.user
		res.redirect('/#login')
	})

	router.use(function (err, req, res, next) {
		console.log("middleware d'erreurs !")
		console.log(err)
	})
	return router;
}
// module.exports = router;
