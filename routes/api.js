var express = require('express');
var router = express.Router();
var rdb = require('../lib/database.js');
var md = require('../lib/middlewares.js')
var multer = require('multer')
var Users = require('../lib/User.js')
var mkdirp = require('mkdirp')
var notif = require('../lib/Notification.js')
var mediaDir = __dirname + '/../public/upload/'
var Chat = require('../lib/Chat.js')
var Interests = require('../lib/Interests.js')
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
			return isLiked && Users.isLiked(targetedUser, currentUser) 
		})
		.then( (match) => {
			swaglogger("Is it a match ? " + match)
			if (match === true) {
				sendNotification({from: currentUser, to: targetedUser, type: 'match'});
				sendNotification({from: targetedUser, to: currentUser, type: 'match'});
				return Chat.getChatRoomFromUsers([currentUser, targetedUser]).then( (roomId) => {
					swaglogger("The chat room already exists ?")
					swaglogger(roomId)
					if (roomId.length) {
						Chat.enableRoom([currentUser, targetedUser])
						swaglogger("Yes, " + roomId[0].id)
						return roomId[0].id;
					}
					else {
						swaglogger("No, creation of the room")
						return Chat.createRoom([currentUser, targetedUser]).then( (dbChatRes) => {swaglogger(dbChatRes); return dbChatRes.generated_keys[0]})
					}
				})
			} else {
				console.log('disable room')
				Chat.disableRoom([currentUser, targetedUser])
				return -1
			}
		})
		.then ( (chatId) => {
			sendChatStatus({to: currentUser, from: targetedUser, can: chatId != -1, chatId: chatId != -1 ? chatId : false})
			sendChatStatus({from: currentUser, to: targetedUser, can: chatId != -1, chatId: chatId != -1 ? chatId : false})
		})

	})
	function swaglogger(txt) {
		console.log('\n\n-----\n', txt, '\n-----\n\n')
	}
	function sendNotification(args) {
		Users.addNotifications({emitter: args.from, receiver: args.to, type: args.type, created: new Date().toLocaleString()})
		.then( (dbInsertion) => {
			if (io.users[args.to]) {
				io.users[args.to].emit('notification', notif({emitter: args.from, receiver: args.to, type: args.type, id: dbInsertion.generated_keys[0]}))
				swaglogger("notification sent from " + args.from + " to " + args.to);
			}
		})
	};
	function sendChatStatus(args) {
		console.log('sendChatStatus !', args)
		if (io.users[args.to]) {
			io.users[args.to].emit('chatStatus', args)
		}
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
		if (req.body.tag == "") return res.send({err: "Nope, empty tag"})
		Interests.getByName(escapeHtml(req.body.tag))
		.then((tag) => {
			console.log(tag)
			if (!tag.length) {
				swaglogger('tag doesnt exist')
				return Interests.add(escapeHtml(req.body.tag)).then( (created) => {return created.generated_keys[0]})
			}
			else {
				swaglogger('tag exists')
				return tag[0].id
			}
		})
		.then( (id) => {
			console.log(id)
			Users.hasInterest(req.session.user.id, id).then( (result) => {
				console.log(result)
				if (!result) {
					Users.addInterest(req.session.user.id, id)
					res.send({id: id, content: escapeHtml(req.body.tag)})
				} else {
					res.send({err: 'already there'})
				}
			})
		})
	})
	var escapeHtml = function(text) {
		var map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&#34;',
			"'": '&#39;'
		};
		return text.replace(/[&<>"']/g, function(m) { return map[m]; });
	}

	router.get('/chat/:chatId', md.isAuth, function(req, res, next) {
		Chat.getData(req.params.chatId)
		.then( (result) => {
			if (!result)
				res.status(404).send({err: "Nope, ce chat n'existe pas"})
			else if (result.users.indexOf(req.session.user.username) == -1)
				res.status(401).send({err: "Vous ne participez pas a cette discussion"})
			else if (result.enabled != true)
				res.status(401).send({err: "Ce chat n'est plus actif"})
			else {
				res.status(200).send(result);
			}
		})
	})

	router.post('/chat/:chatId/messages', md.isAuth, function(req, res, next) {
		console.log('Ajout nouveau message !')
		swaglogger(req.body)
		Chat.getData(req.params.chatId).then( (chatInfos) => {
			if (chatInfos != null && chatInfos.enabled === true && chatInfos.users.indexOf(req.body.username) != -1 && req.body.username === req.session.user.username)
				return chatInfos;
			else
				return -1
		})
		.then( (chatInstance) => {
			if (chatInstance != -1) {
				swaglogger(req.body)
				var safeMessage = {username: req.body.username, content: escapeHtml(req.body.content), chat: req.body.chat}
				Chat.addMessage(req.params.chatId, safeMessage);
				if (io.users[chatInstance.users[0]])
					io.users[chatInstance.users[0]].emit('message', safeMessage)
				if (io.users[chatInstance.users[1]])
					io.users[chatInstance.users[1]].emit('message', safeMessage)
				console.log(chatInstance)
				return res.send(req.body)
			} else {
				swaglogger('mehh');
				return res.send({err: "nope, sry"})
			}
		}) 

	})
	router.get('/users/:username/conversations', md.isAuth, (req, res, next) => {
		if (req.params.username == req.session.user.username) {
			Users.getChatRooms(req.params.username, {enabledOnly: true}).then( (result) => {
				res.send(result)
			})
		}
	})
	return router;
}
// router.post('/users/:username/interests', )
// module.exports = router;
