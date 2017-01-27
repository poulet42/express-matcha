$(document).ready(function() {
	//TOGGLE CHAT WINDOW
	$('.User__matches').on('click', '.Chat__toggle', function() {
		var chatItem = $(this).parent();
		$(this).toggleClass('active').parent().siblings().find('.Chat__toggle').removeClass('active')
		if ($(this).hasClass('active')) {
			$('.Chat__container').data('use', chatItem.data('chatid')).addClass('Chat__container--active')
			$('body').addClass('utils-prevent-scroll')
		}
		else {
			$('.Chat__container').removeClass('Chat__container--active').data('use', '')
			$('body').removeClass('utils-prevent-scroll')
		}
		getConversationData({id: chatItem.data('chatid'), connectedTo: chatItem.data('chatwith')}, populateConversation)
		$(this).parent().removeClass("Match__Item--unread")
	})


	//GET MESSAGES FROM ROOM ID
	var getConversationData = function(args, whenDone) {
		$.ajax({
			url: 'https://localhost:3001/api/chat/' + args.id,
			type: 'GET',
			success: function (data) {
				whenDone(args, data);
			}
		})
	}
	//USE RETRIEVED DATA TO POPULATE CHAT WINDOW
	var populateConversation = function(chatId, data) {
		var messagesContainer = $('.Messages__wrapper');
		var fakeMsgContainer = $('<div></div>')
		for (var i = 0, j = data.messages.length - 1; i <= j; i++) {
			fakeMsgContainer.append(createMessage(data.messages[i]))
		}
		messagesContainer.html(fakeMsgContainer.children())
		$('#chatHelper__id').val(chatId.id)
		messagesContainer.scrollTop(messagesContainer[0].scrollHeight)
	}

	//GENERATING DOM OF A CHAT ITEM
	var createMessage = function(data) {
		var msgClass = "Messages__item"
		if (data.emitter === me)
			msgClass += " Messages__item--me"
		return ('\
			<li class="' + msgClass + '"> \
			<span class="Message__from">' + data.emitter + '</span> \
			<span class="Message__content">' + data.content + '</span> \
			</li> \
			')
	}


	//SUBMIT MESSAGE
	$('.Chat__zone').on('submit', function(e) {
		e.preventDefault();
		var formdata = $(this).serialize();
		$('.Chat__input').val('')
		$.ajax({
			url: 'https://localhost:3001/api/chat/' + $('#chatHelper__id').val() + '/messages',
			type: 'POST',
			data: formdata,
			success: function(data) {
				console.log('sweg')
			}
		})
	})


	//SOCKET : CAN CHAT ?
	socket.on('chatStatus', (chat) => {
		if (chat.can == true) {
			$('.User__matches').append("<div class='Match__Item' data-chatwith='" + chat.from + "'  data-chatid='" + chat.chatId + "'><a href='#' class='Chat__toggle'><span>" + chat.from + "</span></a></div>")
		} else {
			$('.User__matches').find('[data-chatwith="' + chat.from + '"]').remove();
		}
	})

    //SOCKET : NEW MESSAGE
    socket.on('message', (message) => {
    	console.log(message)
    	if ($('.Chat__container').data('use') === message.chat){
    		$('.Messages__wrapper').append(createMessage({emitter: message.username, content: message.content}))
    		$('.Messages__wrapper').scrollTop($('.Messages__wrapper')[0].scrollHeight)
    	}
    	else {
    		console.log(message.username != me)
    		var currentToggle = $('.Match__Item[data-chatid=' + message.chat + ']')
    		if (currentToggle.length > 0) {
    			currentToggle.addClass("Match__Item--unread")
    		}
    	}
    })
})
