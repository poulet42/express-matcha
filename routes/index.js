var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Matcha - Home' });
})

router.get('/register', (req, res, next) => {
	res.render('register', { title: 'Matcha - Register'})
})

module.exports = router;
