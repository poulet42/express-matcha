function Validator(data) {
	this.dataSource = data.dataSource
	this.constraints = data.constraints
	this.errors = {}
}

Validator.prototype.validate = function() {
	for (var i = 0, j = this.constraints.length; i < j; i++) {
		var currConstraint = this.constraints[i]
		if (this.dataSource[currConstraint.name] != undefined)
			this.check(this.dataSource[currConstraint.name], currConstraint)
	}
	for (var key in this.errors) return false; return true;
}

Validator.prototype.check = function(string, tests) {
	console.log("test de " + string)
	var err = []
	var strLen = string.length
	var minLength = tests.min || 0
	var maxLength = tests.max || strLen

	if ( strLen < minLength || strLen > maxLength )
		err.push({type:"size", msg: tests.name + " doesn't respect the size constraint"})
	if (tests.regex && !new RegExp(tests.regex, 'g').test(string)) {
		err.push({type:"regex", msg: tests.name + " doesn't respect the regex constraint"})
	}
	if (err.length > 0)
		this.errors[tests.name] = err
}

Validator.prototype.getErrors = function() {
	return this.errors
}

module.exports = Validator
