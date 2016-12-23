$(document).ready(function() {
	console.log(dbInterests)
	var interestsDel = $('.Tag__close')
	interestsDel.on('click', function() {
		var x = -1;
		var tag = $(this).parent('.Tag')
		var value = tag.data('value')
		if ((x = dbInterests.indexOf(value)) != -1) {
			dbInterests.splice(x, 1);
			tag.remove()
		}
	})
})