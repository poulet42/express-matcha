$(document).ready(function() {
	var getPhoto = function(filename) {
		var itemClass = filename === profilePic ? "Photos__item Photos__item--selected" : "Photos__item"
		return (" \
			<div class='" + itemClass + "'> \
				<img src='/upload/" + username + "/" + filename + "' />\
			</div> \
			")
	}
	$('.User__photos.Modal').one('modalOpen', function() {
		$.ajax({
			url: 'https://localhost:3001/api/users/' + username + '/photos/',
			type: 'GET',
			success: function (data) {
				console.log(data.result)
				var photosContainer = $('#js-photos-container')
				var fakeContainer = $('<div></div>')
				for (var i = data.result.length - 1; i >= 0; i--) {
				//	populateProfilePics(data.result[i])
					fakeContainer.append(getPhoto(data.result[i]))
				}
				console.log('done', fakeContainer)
				photosContainer.append(fakeContainer.children())
			},
			error: function (err) {
				console.log(err)
			}
		})
	})
	console.log(dbInterests)
	var interestsDel = $('.Tag__close')
	var thumbAdd = $('.Thumbnail__add')
	interestsDel.on('click', function(e) {
		e.preventDefault()
		var tag = $(this).parent('.Tag')
		var value = tag.data('id')
		var x = $.grep(dbInterests, function(obj) {return obj.id == value})
		if (x.length > 0) {
			$.ajax({
				url: 'https://localhost:3001/api/users/' + username + '/interests/' + value,
				type: 'DELETE',
				success: function(data) {
					dbInterests.splice(dbInterests.indexOf(x), 1);
					tag.remove()
					console.log('interet supprimé')
				},
				error: function(err) {
					console.log(err)
					//Errors.add(err.responseJSON.error)
				}
			})
		} else {
			console.log(x)
		}
	})
})