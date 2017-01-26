(function(){
	var userPhotos = [];
	var getLightboxDom = function() {
		return ("<img class='Lightbox__preview' /> \
				 <a href='#' class='Lightbox__btn Lightbox__btn--previous'><i class='fa fa-chevron-left'></i></a> \
				 <a href='#' class='Lightbox__btn Lightbox__btn--next'><i class='fa fa-chevron-right'></i></a>")
	}
	var initLightBox = function() {
		var startIndex = 0;
		if (typeof profilePic != "undefined")
			startIndex = userPhotos.indexOf("/upload/" + username + "/" + profilePic)
		console.log(profilePic, userPhotos)
		displayPhoto(startIndex)
	}

	var displayPhoto = function(index) {
		console.log(index)
		$(".Photos__Modal").find(".Lightbox__preview").attr("src", userPhotos[index]).data('index', index)

	}

	$(".Photos__Modal").on('click', ".Lightbox__btn", function() {
		var currentImg = $(".Photos__Modal").find(".Lightbox__preview")
		var tabLength = userPhotos.length
		var index = parseInt(currentImg.data('index'))
		if ($(this).is(".Lightbox__btn--next")) {
			displayPhoto((index + 1) % (tabLength))
		} else {
			displayPhoto(index == 0 ? tabLength - 1 : index - 1)
		}
	})
	
	$('.Photos__Modal.Modal').on('modalOpen', function() {
		var self = this;
		$.ajax({
			url: 'https://localhost:3001/api/users/' + username + '/photos/',
			type: 'GET',
			success: function (data) {
				userPhotos = data.result.map( function(item) {
					return "/upload/" + username + "/" + item;
				})
				if (userPhotos.length < 1)
					$(self).addClass("Modal--default").html("<p style='color:#d25a5a;text-align:center'>This user doesn't have any photos yet</p>")
				else {
					console.log('enough photos')
					$(self).removeClass("Modal--default").html(getLightboxDom())
					initLightBox();
				}
			},
			error: function (err) {
				console.log(err)
			}
		})
	})
})()