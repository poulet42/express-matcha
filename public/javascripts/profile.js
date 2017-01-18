$(document).ready(function() {
	$('.Tag__input').on('input', function(){ 
		console.log('k')
		var size = parseInt($(this).attr('size')); 
		var chars = $(this).val().length + 1;

		$(this).attr('size', Math.max(chars, 14)); 
	}); 
	console.log('username = ' + username)
	var getPhoto = function(filename) {
		var itemClass = filename === profilePic ? "Photos__item Photos__item--selected" : "Photos__item"
		return (" \
			<div class='" + itemClass + "'> \
			<img src='/upload/" + username + "/" + filename + "' />\
			</div> \
			")
	}

	$('.Tag__edit').on('submit', function(e) {
		e.preventDefault();
		addTag($(this).serialize())
		$(this).find('.Tag__input').val("").attr('size', "14")
		loading($('.Profile__tags'), true)
	})

	var addTag = function(fData) {
		$.ajax({
			url: 'https://localhost:3001/api/users/' + username + '/interests',
			type: "POST",
			data: fData,
			success: function(result) {
				if (!result.err)
					displayTag(result)
				loading($('.Profile__tags'), false)
			}
		})
	}

	var loading = function(elem, mode) {
		if (mode == true) {
			elem.append( function(){
				return ("<div class='Profile__loading'><i class='fa fa-circle-o-notch fa-spin fa-3x fa-fw'></i></div>")	
			})
		}
		else {
			elem.find('.Profile__loading').remove()
		}
	}
	var displayTag = function(data) {
		$('.Tag__edit').before(function() {
			dbInterests.push({label:data.content, id: data.id})
			return (" \
				<div class='Tag' data-value='" + data.content + "' data-id='" + data.id + "'> \
				<span class='Tag__content'>" + data.content + "</span> \
				<a href='#' class='Tag__icon Tag__close'><i class='fa fa-close'></i></a> \
				</div> \
				")
		})
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
	var interestsDel = $('.Tag__close')
	var toggleLike = $('#js-profile-like');
	var thumbAdd = $('.Thumbnail__add')
	var editLikeBtn = function(bool) {
		toggleLike.removeClass('Loading').find('.Btn__text').text(bool === true ? "Dislike" : "Like")
		toggleLike.find('.Btn__icon i').addClass('fa-heart').removeClass('fa-circle-o-notch fa-spin fa-fw')
	}
	$('.Tags__container').on('click', '.Tag__close', function(e) {
		e.preventDefault()
		var tag = $(this).parent('.Tag')
		var value = tag.data('id')
		$(this).find('i').removeClass('fa-close').addClass('fa fa-circle-o-notch fa-spin fa-fw')
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
	toggleLike.on('click', function(e) {
		if (toggleLike.is('Loading'))
			return ;
		toggleLike.addClass('Loading').find('.Btn__icon i').removeClass('fa-heart').addClass('fa-circle-o-notch fa-spin fa-fw')
		e.preventDefault();
		$.ajax({
			url: 'https://localhost:3001/api/users/' + username + '/likes',
			type: 'POST',
			success: function(data) {
				likedStatus = data.liked
				console.log(data.liked)
				editLikeBtn(likedStatus)
				console.log(username)
				//socket.emit('send notification', {receiver: username, content: (likedStatus ? "a aimé" : "n'aime plus") + " votre profil"})
			},
			error: function(err) {
				console.log(err)
			}
		})
	})
})