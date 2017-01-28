$(document).ready(function() {
	$('#mdr').remove();
	
	$('.Sort__Dropdown').on('dropChange', function(e, val) {
		// console.log('shit')
		sortProfilesBy({
			sort: val,
			data: filterUsers(users)
		}, populateDashboard);
	})

	$('.Filter__input').on('change', function() {
		if( $(this).is("[data-filter='agemin']") && $(this).val() > $("[data-filter='agemax']").val())
			$(this).val($("[data-filter='agemax']").val())
		else if ( $(this).is("[data-filter='agemax']") && $(this).val() < $("[data-filter='agemin']").val())
			$(this).val($("[data-filter='agemin']").val())
		sortProfilesBy({
			sort: $('.Sort__Dropdown').data('value'),
			data: filterUsers(users)
		}, populateDashboard)
	})
	

	var sortProfilesBy = function(param, cb) {
		param.sort = (param.sort || "Location").toLowerCase();
		var use = 
		{
			age: function(a, b) {return a.doc.age <= b.doc.age},
			location: function(a, b) {return a.dist <= b.dist},
			popularity: function(a, b) {return a.doc.popularity >= b.doc.popularity},
			"common tags": function(a, b) {return a.doc.interests.length > b.doc.interests.length}
		}
		cb(param.data.sort(use[param.sort]));
	}

	var filterUsers = function(userTab) {
		var ageMin = Math.max(parseInt($('.Filter__input[data-filter="agemin"]').val()), 0)
		var ageMax = Math.min(parseInt($('.Filter__input[data-filter="agemax"]').val()), 100)
		var distMax = Math.min(parseInt($('.Filter__input[data-filter="distmax"]').val()) * 1000, 500000)
		var commonTagsMin = Math.max(parseInt($('.Filter__input[data-filter="mintags"]').val()), 0) || 0
		var popularityMin = Math.max(parseInt($('.Filter__input[data-filter="popularity"]').val()), 0) || 0
		// console.log("filter with :", "age > " + ageMin + " < " + ageMax, "dist < " + distMax, "common tags > " + commonTagsMin)
		return userTab.filter( function(elem) {
			// console.log(elem.dist)
			return (elem.doc.age >= ageMin && elem.doc.age <= ageMax && popularityMin <= elem.doc.popularity &&
				elem.dist <= parseInt(distMax) && elem.doc.interests.length >= commonTagsMin
				)
		})
	}
	var populateDashboard = function(sortedUsers) {
		var fakeDashboard = $("<div></div>");
		if (sortedUsers.length > 0) {
			for (var i = sortedUsers.length - 1; i >= 0; i--) {
				fakeDashboard.append(createCard(sortedUsers[i]))
			}
			$('.Dashboard__grid').html(fakeDashboard.children())
		} else 
			$('.Dashboard__grid').html("<span style='display:block; text-align:center;padding: 20px 0; font-size: 24px; color: #999;'>Pas de résultats</span>")
	}

	var createCard = function(curr) {
		var card = "";


		card += "<div class='Dashboard__card'>"
		card += "<a href='/profile/" + curr.doc.username + "' >"
		card += "<div class='Card__Thumbnail' "
		if (curr.doc.avatar) {
			card += 'style="background-image: url(\'upload/' + curr.doc.username + '/' + curr.doc.avatar + '\')"'
		}
		card += "></div></a>"
		card += "<div class='Card__content'>"
		card += '<div class="Card__item Card__username"><i class="fa fa-user"></i>'
		card += "<a href='/profile/" + curr.doc.username + "'>" + curr.doc.username + "</a>"
		card += " <i class='fa fa-" + (curr.doc.gender == "female" ? "venus" : "mars") + "'></i> - " + curr.doc.age + "</div>"
		card += "<div class='Card__item Card__location'><i class='fa fa-map-marker'></i>" + Math.round(curr.dist / 1000).toFixed(2) + " kilometers</div>"
		card += "<div class='Card__item Card__popularity'><i class='fa fa-fire'></i>" + curr.doc.popularity + "</div>"
		if (curr.doc.interests.length > 0) {
			card += "<div class='Card__item Card__tags'> \
			<i class='fa fa-tag'></i> \
			<div style='display: inline-block;'>"
			curr.doc.interests.forEach(function(currInterest) {
				card += "<div class='Tag Tag--little'>" + currInterest.label + "</div>\n"
			})
			card += "</div></div>"
		}
		card += "</div></div>"
		return card;
	}
	sortProfilesBy({
		sort: $('.Sort__Dropdown').data('value'),
		data: filterUsers(users)
	}, populateDashboard);
	$('.Dashboard__grid').removeClass('utils-hidden')

})