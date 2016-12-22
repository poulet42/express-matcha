var express = require('express');
var router = express.Router();
var rdb = require('../lib/database.js');
var md = require('../lib/middlewares.js')

router.post('/auth/login', function(req, res, next) {
	rdb.findBy('users', 'username', req.body.username)
	.then( (user) => {
		user = user[0]
		if (!user) {
			res.status(404).json({ error: 'User not found' })
		} else if (user.password === req.body.password) {
			req.session.user = {id: user.id, username: user.username}
			res.status(200).json({redirect: '/profile/' + user.username})
		} else {
			res.status(401).json({ error: 'Bad credentials' })
		}
	})
});

router.get('/users/:username', md.isAuth, function(req, res, next) {
	console.log(req.params.username)
	res.render('profile')
	rdb.findBy('users', 'username', req.params.username)
	.then( (user) => {
		user = user[0]
		if (!user) {
			res.status(404).json({ error: 'User not found' })
		}
	})
});
module.exports = router;
