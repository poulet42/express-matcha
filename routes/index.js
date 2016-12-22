var express = require('express');
var router = express.Router();
var md = require('../lib/middlewares.js')
var rdb = require('../lib/database.js')
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Matcha - Home' });
})
router.get('/profile/:username', md.isAuth, function (req, res, next) {
	console.log('route profile  / user')
	if (req.params.username == "") {
		console.log('pas de req params ? redirection vers profil utilisateur courant')
		return res.redirect('/profile/' +  req.session.user.username)
	}
	rdb.findBy('users', 'username', req.params.username)
	.then( (user) => {
		user = user[0]
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		} else {
			delete user.password
			console.log(user)
			res.render('profile', {
				title: 'Matcha - ' + req.params.username + '\'s Profile', 
				profile: user
			})
		}
	})
})

router.get('/register', md.isGuest, (req, res, next) => {
	res.render('register', { title: 'Matcha - Register'})
})

router.get('/logout', (req, res, next) => {
	req.session.user = null
	res.redirect('/#login')
})

router.use(function (err, req, res, next) {
	console.log("middleware d'erreurs !")
	console.log(err)
})
module.exports = router;
