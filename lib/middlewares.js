var Validator = require('./validator.js')
module.exports = {
	isAuth: (req, res, next) => {
		if (req.session.user)
			next()
		else 
			return res.redirect('/#login')
	},
	isGuest: (req, res, next) => {
		if (req.session.user)
			return res.redirect('/profile/' + req.session.user.username)
		else
			next()
	},
	isOwner: (req, res, next) => {
		if (req.session.user.username === req.params.username)
			next()
		else
			return res.status(401).send({error: "You shall not pass"})
	},
	validateRegistration: (req, res, next) => {
		val = new Validator({
			dataSource: req.body,
			constraints: 
			[
			{name: 'fname', min: 3, regex: /^[a-zA-Z]*$/},
			{name: 'lname', min: 3, regex: /^[a-zA-Z]*$/},
			{name: 'username', min: 4, max: 12, regex: /^[a-zA-Z0-9]*$/},
			{name: 'password', regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/g},
			{name: 'email', regex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/}
			]
		})
		if (val.validate() && req.body.password === req.body.passwordConf) {
			delete req.body.passwordConf
			return next()
		} else {
			return res.status(401).json({error: "Les champs sont invalides"})
		}
	},
	logVisit: (req, res, next) => {
		io.emmit('visit', {emitter: req.session.user.username, receiver: req.params.username})
	}
}