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
var passwordHash = require('password-hash');
module.exports = function(io) {
	router.post('/auth/login', md.isGuest, function(req, res, next) {
		Users.findByUsername(req.body.username, true)
		.then( (user) => {
			user = user[0]
			if (!user) {
				res.status(404).json({ error: 'User not found' })
			} else if (passwordHash.verify(req.body.password, user.password)) {
				req.session.user = {id: user.id, username: user.username}
				res.status(200).json({redirect: '/profile/' + user.username})
			} else {
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
				req.body.password = passwordHash.generate(req.body.password)
				req.body.forgot = passwordHash.generate(req.body.username + (Math.random() * (100 - 2) + 2))
				console.log('enregistrement en db : ')
				console.log(req.body)
				Users.register(req.body)
				.then((dbRes) => {
					mkdirp(mediaDir + req.body.username, function (err) {
						if (err) console.error(err)
							else console.log('Repertoire utilisateur créé')
						});
					req.session.user = {id: dbRes.generated_keys[0], username: req.body.username}
					res.status(200).json({redirect: '/profile/' + req.session.user.username})
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
		if (req.params.username == "me")
			req.params.username = req.session.user.username
		Users.getPhotos(req.params.username, function(error, result) {
			if (!error) {
				res.status(200).json({result})
			} else {
				console.log(error);
				res.status(401).json({error})
			}
		})
	})

	router.post('/users/:username/block', md.isAuth, function(req, res, next) {
		if (req.session.user.username == req.params.username)
			return res.status(401).send({error: "You can't block yourself !"})
		var currentUser = req.session.user.id;
		var targetedUser = req.params.username;
		Users.toggleBlock(currentUser, targetedUser)
		.then( (isBlocked) => {
			swaglogger("isBlocked == " + isBlocked)
			res.status(200).send({blocked: isBlocked})
		})
	})

	router.post('/users/:username/likes', md.isAuth, function(req, res, next) {
		if (req.session.user.username == req.params.username)
			return res.status(401).send({error: "You can't like yourself !"})
		Users.getAvatar(req.session.user.username)
		.then( avatar => {
			return avatar != "" && typeof avatar != "undefined"
		}).then( (canLike) => {
			if (!canLike)
				return res.status(401).send({error: "You must upload a profile picture first"})
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
				if (isLiked == true)
					Users.addPopularity(req.params.username, 8)
				return isLiked && Users.isLiked(targetedUser, currentUser) 
			})
			.then( (match) => {
				swaglogger("Is it a match ? " + match)
				if (match === true) {
					Users.addPopularity(req.params.username, 3)
					Users.addPopularity(req.session.user.username, 3)
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
	})
	function swaglogger(txt) {
		console.log('\n\n-----\n', txt, '\n-----\n\n')
	}
	function sendNotification(args) {
		Users.getBlacklist(args.to)
		.then( (blacklist) => {
			swaglogger("blacklist ::: ")
			swaglogger(blacklist)
			swaglogger("oh shit waddup")
			swaglogger("blacklisted ? " + blacklist.indexOf(args.from) != -1 ? "true" : "false")
			if (blacklist.indexOf(args.from) != -1) {
				return false;
			}
			Users.addNotifications({emitter: args.from, receiver: args.to, type: args.type, created: new Date().toLocaleString()})
			.then( (dbInsertion) => {
				if (io.users[args.to]) {
					io.users[args.to].emit('notification', notif({emitter: args.from, receiver: args.to, type: args.type, id: dbInsertion.generated_keys[0]}))
					swaglogger("notification sent from " + args.from + " to " + args.to);
				}
			})
		})
	};
	function sendChatStatus(args) {
		Users.getBlacklist(args.to)
		.then( (blacklist) => {
			swaglogger("blacklist ::: ")
			swaglogger(blacklist)
			swaglogger("oh shit waddup")
			swaglogger("blacklisted ? " + blacklist.indexOf(args.from) != -1 ? "true" : "false")
			if (blacklist.indexOf(args.from) != -1) {
				return false;
			}
			console.log('sendChatStatus !', args)
			if (io.users[args.to]) {
				io.users[args.to].emit('chatStatus', args)
			}
		})
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
		fileFilter,
		onError : function(err, next) {
			console.log("SHIIIIEEEET")
			next("Sorry, this image doesn't fill the conditions, try another one");
		}
	}).single('profileImage')
	router.post('/users/:username/photos', md.isAuth, upload, function(req, res, next) {
		console.log("hola")
		if (req.params.username == "me")
			req.params.username = req.session.user.username
		if (!req.file || req.session.user.username !== req.params.username) {
			return res.status(401).send({error: "Sorry, looks like it didn't work"})
		}
		Users.getPhotos(req.params.username, (error, result) => {
			if (error)
				return res.status(401).send({err: "Sorry, this image doesn't fill the conditions, try another one"})
			var can = (result.length <= 5)
			if (can) {
				// Users.addPhoto(req.params.username, req.file.filename)
				res.status(201).send({path: "/upload/" + req.params.username + "/" + req.file.filename})
			}
			else {
				Users.deletePhoto(req.params.username, req.file.filename, (err, result) => {
					return res.status(401).send({err: "You can't upload more than 5 files"})
				})
			}
		})
	})
	router.use( (err, req, res, next) => {
		var determineError = {
			"LIMIT_FILE_SIZE": "Sorry, this file is too big, try another one"
		}
		res.status(401).send({error: determineError[err.code] || "Sorry, something went wrong"})
	})
	router.delete('/users/:username/photos/:imageid', md.isAuth, upload, function(req, res, next) {
		if (req.params.username == "me")
			req.params.username = req.session.user.username
		if (req.session.user.username !== req.params.username) {
			return res.status(401).send({err: "nope"})
		}
		Users.getAvatar(req.params.username)
		.then( (result) => {
			console.log('current avatar : ', result[0], "req", req.params.imageid)
			if (result[0] == req.params.imageid)
				Users.deleteAvatar(req.params.username)
		})
		Users.getPhotos(req.params.username, (error, result) => {
			if (result.indexOf(req.params.imageid) != -1) {
				return Users.deletePhoto(req.params.username, req.params.imageid, (err, result) => {
					if (err) return res.status(401).send({error: err})
						else res.status(200).send({ok: true, deleted: req.params.imageid})			
					})
			}
		})
		
	})

	router.put('/users/me/photos/:imageid', md.isAuth, function(req, res, next) {
		Users.addPhoto(req.session.user.username, req.params.imageid)
		.then( () => {
			return res.status(200).send({path: "/upload/" + req.session.user.username + "/" + req.params.imageid})
		})
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
				res.status(404).send({error: "Nope, ce chat n'existe pas"})
			else if (result.users.indexOf(req.session.user.username) == -1)
				res.status(401).send({error: "Vous ne participez pas a cette discussion"})
			else if (result.enabled != true)
				res.status(401).send({error: "Ce chat n'est plus actif"})
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
				return res.status(401).send({error: "Vous ne pouvez plus discuter"})
			}
		}) 

	})
	router.get('/users/:username/conversations', md.isAuth, (req, res, next) => {
		if (req.params.username == req.session.user.username) {
			Users.getChatRooms(req.params.username, {enabledOnly: true}).then( (result) => {
				swaglogger("CONVERSATIONS ::::::::")
				Users.getBlacklist(req.session.user.username)
				.then( (list) => {
					return result.filter(function(current) {
						swaglogger(current.users[1 - current.users.indexOf(req.session.user.username)])	
						return list.indexOf(current.users[1 - current.users.indexOf(req.session.user.username)]) == -1
					})
				})
				.then ( (result) => {
					res.send(result)	
				})
			})
		}
	})

	router.post('/users/:username/location', md.isAuth, (req, res, next) => {
		if (req.params.username == "me") {
			req.params.username = req.session.user.username
		}
		swaglogger(req.body.location)
		if (req.params.username == req.session.user.username) {
			Users.setLocation(req.session.user.id, req.body.location)
			.then( (result) => {
				return res.send({location: req.body.location})
			})
		}
	})

	router.put('/users/me/gender', md.isAuth, (req, res, next) => {
		var code = ['male', 'female', 'unknown'];
		if (typeof code[req.body.gender] == "undefined")
			return res.status(401).send({err: "This gender doesn't exist"})
		Users.setGender(req.session.user.id, code[req.body.gender])
		return res.status(200).send({ok: true})
	})
	router.put('/users/me/orientation', md.isAuth, (req, res, next) => {
		var code = ['boys', 'girls', 'both'];
		swaglogger(req.body.orientation)
		console.log(code[parseInt(req.body.orientation)])
		if (typeof code[parseInt(req.body.orientation)] == "undefined")
			return res.status(401).send({err: "This gender doesn't exist"})
		Users.setOrientation(req.session.user.id, code[req.body.orientation])
		return res.status(200).send({ok: true})
	})

	router.put('/users/me/biography', md.isAuth, (req, res, next) => {
		if (req.body.biography.length > 180)
			return res.status(402).send({err: "Your biography is too long"})
		Users.setBiography(req.session.user.id, escapeHtml(req.body.biography))
		return res.status(200).send({ok: true})
	})
	return router;
}
// router.post('/users/:username/interests', )
// module.exports = router;
