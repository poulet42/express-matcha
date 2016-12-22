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
	}
}