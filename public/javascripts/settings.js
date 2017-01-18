(function(){
	geolocator.config({
		language: "en",
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

	$('.Settings__label').on('click', function() {
		var settingsEntry = $(this).parent();
		settingsEntry.toggleClass('is-opened').siblings('.Settings__entry').removeClass('is-opened')
	})

	$('.Location__btn').on('click', function() {
		launchGeolocation(populateInput)
	})
})()