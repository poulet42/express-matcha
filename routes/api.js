var express = require('express');
var router = express.Router();
var rdb = require('../lib/database.js');

router.post('/auth/login', function(req, res, next) {
	rdb.findBy('users', 'username', req.body.username)
	.then( (user) => {
		user = user[0]
		if (!user) {
			res.status(404).json({ error: 'User not found' })
		} else if (user.password === req.body.password) {
			req.session.user = {id: user.id, username: user.username}
			res.status(200).json(req.session.user)
		} else {
			res.status(401).json({ error: 'Bad credentials' })
		}
	})
});
module.exports = router;
