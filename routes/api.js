var express = require('express');
var router = express.Router();
var rdb = require('../lib/database.js');
var md = require('../lib/middlewares.js')
var multer = require('multer')
var Users = require('../lib/User.js')
var mkdirp = require('mkdirp')
var notif = require('../lib/Notification.js')
var mediaDir = __dirname + '../public/upload/'

module.exports = function(io) {
	router.post('/auth/login', md.isGuest, function(req, res, next) {
		Users.findByUsername(req.body.username, true)
		.then( (user) => {
			user = user[0]
			if (!user) {
				res.status(404).json({ error: 'User not found' })
			} else if (user.password === req.body.password) {
				req.session.user = {id: user.id, username: user.username}
				res.status(200).json({redirect: '/profile/' + user.username})
			} else {
				console.log("user pass: " + user.password, req.body.password )
				res.status(401).json({ error: 'Bad credentials' })
			}
		})
	});
	router.post('/auth/register', md.isGuest, md.validateRegistration, function(req, res, next) {
		Users.exists(req.body.username, req.body.email)
		.then( (user) => {
			console.log(user)
			user = user[0]
			if (user) {
				res.status(401).json({error: "L'utilisateur existe déjà !"})
			} else {
				console.log('enregistrement en db : ')
				console.log(req.body)
				Users.register(req.body)
				.then((dbRes) => {
					mkdirp(mediaDir + req.body.username, function (err) {
						if (err) console.error(err)
							else console.log('Repertoire utilisateur créé')
						});
					req.session.user = {id: dbRes.generated_keys[0], username: req.body.username}
					res.status(200).json(req.session.user)
				})
			}
		})
	})
	router.get('/users/', md.isAuth, function(req, res, next) {
		Users.list()
		.then( (result) => {
			console.log(result)
			res.send(result)
		})
	})
	router.get('/users/:username', md.isAuth, function(req, res, next) {
		Users.findByUsername(req.params.username)
		.then( (user) => {
			user = user[0]
			if (!user) {
				res.status(404).json({ error: 'User not found' })
			}
			res.send(user)
		})
	});
	router.get('/users/:username/photos', md.isAuth, function(req, res, next) {
		Users.getPhotos(req.params.username, function(error, result) {
			if (!error) {
				res.status(200).json({result})
			} else {
				console.log(error);
				res.status(401).json({error})
			}
		})
	})
	router.post('/users/:username/likes', md.isAuth, function(req, res, next) {
		if (req.session.user.username == req.params.username)
			return res.status(401).send({error: "You can't like yourself !"})


/*
		Users.toggleLike(req.session.user.username, req.params.username).then( (result) => {
			Users.addNotifications({type: result ? 'like' : 'dislike', emitter: req.session.user.username, receiver: req.params.username})
			.then( (nRes) => {
				if (io.users[req.params.username]) {
					io.users[req.params.username].emit('notification', notif({emitter: req.session.user.username, receiver: req.params.username, type: result ? 'like' : 'dislike', id: nRes.generated_keys[0]}))
					Users.isLiked(req.params.username, req.session.user.username).then( (match) => {
						if (match && result === true) {
							Users.createChatroom(req.session.user.username, req.params.username).then( () => {
								io.users[req.params.username].emit('chatStatus', true)
								io.users[req.session.user.username].emit('chatStatus', true)
							})
							Users.addNotifications({type: 'match', emitter: req.session.user.username, receiver: req.params.username}).then( (nResMatch) => {
								io.users[req.params.username].emit('notification', notif({emitter: req.session.user.username, receiver: req.params.username, type: 'match', id: nResMatch.generated_keys[0]}))
							});
							Users.addNotifications({type: 'match', emitter: req.params.username, receiver: req.session.user.username})
							.then( (nResMatchTwo) => {
								if (io.users[req.session.user.username]) {
									io.users[req.session.user.username].emit('notification', notif({emitter: req.params.username, receiver: req.session.user.username, type: 'match', id: nResMatchTwo.generated_keys[0]}))
								}
							});
						}
					})
				}

			})
			res.status(200).send({
				liked: result
			})
		})*/
		var currentUser = req.session.user.username;
		var targetedUser = req.params.username;
		Users.toggleLike(currentUser, targetedUser)
		.then( (isLiked) => {
			swaglogger("isLiked == " + isLiked)
			res.status(200).send({liked: isLiked})
			sendNotification({
				from: currentUser,
				to: targetedUser,
				type: isLiked ? 'like' : 'dislike'
			})
			swaglogger("notification sent from " + currentUser + " to " + targetedUser);
			return isLiked && Users.isLiked(targetedUser, currentUser) 
		})
		.then( (match) => {
			swaglogger("Is it a match ? " + match)
			if (match === true) {
				sendNotification({from: currentUser, to: targetedUser, type: 'match'});
				sendNotification({from: targetedUser, to: currentUser, type: 'match'});
				return Users.createChatroom(currentUser, targetedUser)
			} else {
				return -1;
			}
		})
		.then ( (chatId) => {
			sendChatStatus({to: currentUser, from: targetedUser, can: chatId != -1, chatId: chatId})
		})

	})
	function swaglogger(txt) {
		console.log('\n\n-----\n', txt, '\n-----\n\n')
	}
	function sendNotification(args) {
		Users.addNotifications({emitter: args.from, receiver: args.to, type: args.type})
		.then( (dbInsertion) => {
			if (io.users[args.to])
				io.users[args.to].emit('notification', notif({emitter: args.from, receiver: args.to, type: args.type, id: dbInsertion.generated_keys[0]}))
		})
	};
	function sendChatStatus(args) {
		console.log('sendChatStatus !', args)
	}
	router.post('/users/:username/notifications', md.isAuth, function(req, res, next) {
		Users.getNotifications(req.session.user.username).then( (result) => {
			var niceNotifications = result.map(notif)
			res.status(200).send(niceNotifications)
		})
	})
	var storage = multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, __dirname + "/../public/upload/" + req.session.user.username)
		},
		filename: (req, file, cb) => {
			cb(null, file.fieldname + '-' + Date.now())
		}
	})
	var fileFilter = function (req, file, cb) {
		if (file.mimetype == 'image/png' || file.mimetype == 'image/jpeg' || file.mimetype == 'image/jpg')
			cb(null, true)
		else
			cb(null, false)
	}
	var upload = multer({
		storage,
		limits: {fileSize: 1000000, files:1},
		fileFilter
	}).single('profileImage')
	router.post('/users/:username/photos', md.isAuth, upload, function(req, res, next) {
		if (req.file) {
			Users.addPhoto(req.params.username, req.file.filename)
			res.status(201).send({path: "/upload/" + req.params.username + "/" + req.file.filename})
		} else {
			res.status(401).end()
		}
	})
	router.get('/users/:username/interests', md.isAuth, function(req, res, next) {
		Users.getInterests()
		.then( function(result) {
			res.send(result)
		})
	})
	router.delete('/users/:username/interests/:interest', md.isAuth, function(req, res, next) {
		if (req.params.username === req.session.user.username) {
			Users.removeInterest(req.session.user.id, req.params.interest)
			.then( function(result) {
				res.status(200).json({msg: 'Interest deleted', result})
			}, function (err) {
				res.status(404).json({error: 'Coulnd\'t delete the interest'})
			})
		}
	})

	router.post('/users/:username/interests', md.isAuth, function(req, res, next) {
		console.log('a faire: ajout d\'interets')
	})
	return router;
}
// router.post('/users/:username/interests', )
// module.exports = router;
