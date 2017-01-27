(function(){
	geolocator.config({
		language: "fr",
		google: {
			version: "3",
			key: "AIzaSyAtPf2JK15ebvtLsFEZcB7IIQTlzvgnDY4"
		}
	});
	var options = {
		enableHighAccuracy: false,
		timeout: 5000,
		maximumWait: 10000,  
		maximumAge: 100,  
		desiredAccuracy: 300, 
		fallbackToIP: true,
		addressLookup: true,
		timezone: true,
	};
	var launchGeolocation = function(cb) {
		return geolocator.locate(options, cb);
	}

	var populateInput = function(err, res) {
		if (err) return console.log('err !', err)
			$('.Location__input').val(res.formattedAddress)
	}

	var isAddressValid = function(address, cb) {
		return geolocator.geocode(address, cb)
	}
	var saveAddress = function(err, location) {
		if (err) return Errors.add('Addresse invalide');
		console.log(location)
		$.ajax({
			url: 'https://localhost:3001/api/users/me/location',
			type: 'POST',
			data: {location},
			success: function(result) {
				console.log(result)
			},
			fail: function(error) {
				console.log('error ! ', error)
			}
		})
	}
	var getPhoto = function(filename) {
		var itemClass = (typeof profilePic != 'undefined' && filename === profilePic ? "Photos__item Photos__item--selectable Photos__item--starred" : "Photos__item Photos__item--selectable")
		return (" \
			<div class='" + itemClass + "'> \
			<img src='/upload/" + username + "/" + filename + "' />\
			</div> \
			")
	}
	$('.Settings__label').on('click', function() {
		var settingsEntry = $(this).parent();
		settingsEntry.toggleClass('is-opened').siblings('.Settings__entry').removeClass('is-opened')
	})

	$('.Location__btn').on('click', function() {
		launchGeolocation(populateInput)
	})

	$('.Location__submit').on('click', function() {
		var address = $('.Location__input').val();
		console.log(address)
		isAddressValid(address, saveAddress);
	})

	$('.Photos__add').on('change', function() {
		$.ajax({
			url: "https://localhost:3001/api/users/me/photos",
			type: "POST",
			data: new FormData($('#addPhotoForm')[0]),
			cache: false,
			contentType: false,
			processData: false,
			success: function(result) {
				console.log('photo added')
				$('.Settings__photos').find('.Photos__item--selected').removeClass('Photos__item--selected')
				$('.Settings__photos').children().first().after("<div class='Photos__item Photos__item--selected Photos__item--selectable'><img src='" + result.path + "' ></div>")
				// $('.Profile__thumbnail').css({'backgroundImage': 'url("' +  result.path + '")'})
			},
			error: function(err) {
				Errors.add(err.responseJSON.error)
			}
		})
	})

	$('.Settings__Modal.Modal').one('modalOpen', function() {
		$.ajax({
			url: 'https://localhost:3001/api/users/me/photos/',
			type: 'GET',
			success: function (data) {
				console.log(data.result)
				var photosContainer = $('.Settings__photos')
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

	$('.Settings__photos').on('click', '.Photos__item--selectable', function() {
		$(this).toggleClass('Photos__item--selected').siblings().removeClass('Photos__item--selected')
	})

	$('.Photos__delete').on('click', function() {
		var targetedItem = $('.Photos__item--selected')
		var targetedPhoto = targetedItem.find('img').attr('src');
		var imageId = targetedPhoto.split("/")[3]
		if (!targetedItem || !targetedPhoto || !imageId)
			return false;
		$.ajax({
			url: 'https://localhost:3001/api/users/me/photos/' + imageId,
			type: "DELETE",
			success: function(result) {
				targetedItem.remove();
			},
			fail: function(error) {
				console.log('!!!!!!!!!!!', error, '!!!!!!!!!!!')
			}
		})
	})
	$('.Photos__setProfile').on('click', function() {
		var targetedItem = $('.Photos__item--selected')
		var targetedPhoto = targetedItem.find('img').attr('src');
		var imageId = targetedPhoto.split("/")[3]
		if (!targetedItem || !targetedPhoto || !imageId)
			return false;
		$.ajax({
			url: 'https://localhost:3001/api/users/me/photos/' + imageId,
			type: "PUT",
			data: {photo: targetedPhoto},
			success: function(result) {
				targetedItem.addClass('Photos__item--starred').siblings().removeClass('Photos__item--starred')
				$('.Profile__thumbnail').css({'backgroundImage': 'url("' +  result.path + '")'})
			}
		})
	})

	$('.Orientation__choice').on('change', function() {
		var checkedBox = $('.Orientation__choice:checked')
		if (checkedBox.length != 1)
			return false;
		var orientation = checkedBox.val();
		$.ajax({
			url: "https://localhost:3001/api/users/me/orientation",
			type: "PUT",
			data: {orientation},
			success: function(result) {
				console.log('k', result)
			},
			catch: function(err) {
				alert(err)
			}
		})
		console.log(orientation)
	})
	$('.Gender__choice').on('change', function() {
		var checkedBox = $('.Gender__choice:checked')
		if (checkedBox.length != 1)
			return false;
		var gender = checkedBox.val();
		$.ajax({
			url: "https://localhost:3001/api/users/me/gender",
			type: "PUT",
			data: {gender},
			success: function(result) {
				console.log('k', result)
			},
			catch: function(err) {
				alert(err)
			}
		})
		console.log(gender)
	})
})()